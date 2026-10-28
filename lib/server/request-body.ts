export class RequestBodyError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function readJsonBody(request: Request, maxBytes = 96 * 1024, timeoutMs = 5000): Promise<Record<string, unknown>> {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new RequestBodyError("Request body exceeds the size limit", 413);
  if (!request.body) throw new RequestBodyError("A JSON object is required", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new RequestBodyError("Request body timed out", 408)), timeoutMs); });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), expired]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) throw new RequestBodyError("Request body exceeds the size limit", 413);
      chunks.push(value);
    }
    let value: unknown;
    try { value = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new RequestBodyError("Malformed JSON", 400); }
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new RequestBodyError("A JSON object is required", 400);
    return value as Record<string, unknown>;
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => undefined);
  }
}
