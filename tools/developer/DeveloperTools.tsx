"use client";

import React, { useState } from "react";
import { Textarea, Button, ResultPanel, Input, Select } from "@/components/ui";

// 1. JSON Formatter
export const JsonFormatterTool: React.FC = () => {
  const [input, setInput] = useState('{"name":"Antigravity","tools":137,"active":true}');
  const [indent, setIndent] = useState("2");

  let output = "";
  let error: string | null = null;

  if (input.trim()) {
    try {
      const parsed = JSON.parse(input);
      const spaces = indent === "tab" ? "\t" : Number(indent);
      output = JSON.stringify(parsed, null, spaces);
    } catch (err) {
      if (err instanceof Error) error = err.message;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select
          label="Indentation"
          value={indent}
          onChange={(e) => setIndent(e.target.value)}
          options={[
            { value: "2", label: "2 Spaces" },
            { value: "4", label: "4 Spaces" },
            { value: "tab", label: "Tabs" },
          ]}
        />
      </div>

      <Textarea label="Raw JSON" value={input} onChange={(e) => setInput(e.target.value)} error={error || undefined} rows={6} />

      <ResultPanel title="Formatted JSON" status={error ? "error" : "live"} copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-xs whitespace-pre-wrap">{output || "// Valid formatted JSON will appear here"}</pre>
      </ResultPanel>
    </div>
  );
};

// 2. JSON Validator
export const JsonValidatorTool: React.FC = () => {
  const [input, setInput] = useState('{\n  "status": "valid"\n}');
  const [validation, setValidation] = useState<{ isValid: boolean; message: string; details?: string } | null>(null);

  const validate = () => {
    try {
      const parsed = JSON.parse(input);
      const keys = typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 0;
      setValidation({
        isValid: true,
        message: "Valid JSON syntax!",
        details: `Root type: ${Array.isArray(parsed) ? "Array" : typeof parsed}. Top-level keys: ${keys}.`,
      });
    } catch (err) {
      if (err instanceof Error) {
        setValidation({
          isValid: false,
          message: "Invalid JSON syntax",
          details: err.message,
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Textarea label="Input JSON" value={input} onChange={(e) => setInput(e.target.value)} rows={6} />
      <Button variant="primary" onClick={validate}>Validate JSON</Button>

      {validation && (
        <div className={`p-4 rounded-[10px] border ${validation.isValid ? "bg-[var(--success)]/10 border-[var(--success)] text-[var(--success)]" : "bg-[var(--danger)]/10 border-[var(--danger)] text-[var(--danger)]"}`}>
          <h4 className="font-bold text-sm">{validation.message}</h4>
          <p className="text-xs mt-1 font-mono">{validation.details}</p>
        </div>
      )}
    </div>
  );
};

// 3. JSON Minifier
export const JsonMinifierTool: React.FC = () => {
  const [input, setInput] = useState('{\n  "name": "Toolbox",\n  "count": 137\n}');

  let output = "";
  let error: string | null = null;

  if (input.trim()) {
    try {
      output = JSON.stringify(JSON.parse(input));
    } catch (err) {
      if (err instanceof Error) error = err.message;
    }
  }

  return (
    <div className="space-y-6">
      <Textarea label="Formatted JSON" value={input} onChange={(e) => setInput(e.target.value)} error={error || undefined} rows={6} />

      <ResultPanel title="Minified Output" status={error ? "error" : "live"} copyValue={output} onClear={() => setInput("")}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 4. Base64 Encoder / Decoder
export const Base64EncoderTool: React.FC = () => {
  const [input, setInput] = useState("Hello Antigravity!");
  let encoded = "";
  try {
    encoded = btoa(Array.from(new TextEncoder().encode(input), (byte) => String.fromCharCode(byte)).join(""));
  } catch {
    encoded = "Encoding error";
  }

  return (
    <div className="space-y-6">
      <Textarea label="Plain Text" value={input} onChange={(e) => setInput(e.target.value)} rows={4} />

      <ResultPanel title="Base64 Encoded Result" status="live" copyValue={encoded}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{encoded}</pre>
      </ResultPanel>
    </div>
  );
};

export const Base64DecoderTool: React.FC = () => {
  const [input, setInput] = useState("SGVsbG8gQW50aWdyYXZpdHkh");
  let decoded = "";
  let error: string | null = null;

  if (input.trim()) {
    try {
      decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(input.trim()), (character) => character.charCodeAt(0)));
    } catch {
      error = "Invalid Base64 string";
    }
  }

  return (
    <div className="space-y-6">
      <Textarea label="Base64 String" value={input} onChange={(e) => setInput(e.target.value)} error={error || undefined} rows={4} />

      <ResultPanel title="Decoded Plain Text" status={error ? "error" : "live"} copyValue={decoded}>
        <pre className="font-mono text-sm whitespace-pre-wrap">{decoded || "// Decoded output will appear here"}</pre>
      </ResultPanel>
    </div>
  );
};

// 5. URL Encoder / Decoder
export const UrlEncoderTool: React.FC = () => {
  const [input, setInput] = useState("https://toolbox.local/search?q=pdf & word");
  const output = encodeURIComponent(input);

  return (
    <div className="space-y-6">
      <Textarea label="Raw Text / URL" value={input} onChange={(e) => setInput(e.target.value)} rows={4} />

      <ResultPanel title="URL Encoded Result" status="live" copyValue={output}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

export const UrlDecoderTool: React.FC = () => {
  const [input, setInput] = useState("https%3A%2F%2Ftoolbox.local%2Fsearch%3Fq%3Dpdf%20%26%20word");
  let output = "";
  try {
    output = decodeURIComponent(input);
  } catch {
    output = "Invalid URL encoding";
  }

  return (
    <div className="space-y-6">
      <Textarea label="Encoded URL String" value={input} onChange={(e) => setInput(e.target.value)} rows={4} />

      <ResultPanel title="Decoded URL" status="live" copyValue={output}>
        <pre className="font-mono text-xs break-all whitespace-pre-wrap">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 6. JWT Decoder
function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export const JwtDecoderTool: React.FC = () => {
  const [token, setToken] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFudGlncmF2aXR5IFVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  );

  const getDecodedJwt = () => {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return { error: "Invalid JWT format. Must contain 3 dot-separated parts." };
      const header = JSON.parse(decodeBase64Url(parts[0]));
      const payload = JSON.parse(decodeBase64Url(parts[1]));
      return { header, payload };
    } catch {
      return { error: "Failed to parse base64url JWT payload." };
    }
  };

  const decoded = getDecodedJwt();

  return (
    <div className="space-y-6">
      <Textarea label="JWT Token Input" value={token} onChange={(e) => setToken(e.target.value)} rows={4} />

      {decoded.error ? (
        <p className="text-xs text-[var(--danger)] font-mono">{decoded.error}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <ResultPanel title="Header (Algorithm)" status="live" copyValue={JSON.stringify(decoded.header, null, 2)}>
            <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(decoded.header, null, 2)}</pre>
          </ResultPanel>
          <ResultPanel title="Payload (Claims)" status="live" copyValue={JSON.stringify(decoded.payload, null, 2)}>
            <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(decoded.payload, null, 2)}</pre>
          </ResultPanel>
        </div>
      )}
    </div>
  );
};

// 7. UUID Generator
export const UuidGeneratorTool: React.FC = () => {
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const validCount = Number.isInteger(count) && count >= 1 && count <= 50;

  const generateUuids = () => {
    if (!validCount) { setUuids([]); return; }
    const list: string[] = [];
    for (let i = 0; i < count; i++) {
      list.push(crypto.randomUUID());
    }
    setUuids(list);
  };

  const output = uuids.join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 max-w-xs">
        <Input label="Quantity (1 to 50)" type="number" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} />
        <Button variant="primary" className="mt-5" disabled={!validCount} onClick={generateUuids}>Generate</Button>
      </div>

      {!validCount && <p role="alert">Quantity must be an integer from 1 to 50.</p>}
      <ResultPanel title="Generated v4 UUIDs" status="live" copyValue={output}>
        <pre className="font-mono text-xs leading-relaxed">{output}</pre>
      </ResultPanel>
    </div>
  );
};

// 8. Hash / MD5 / SHA-256 Generators
export const HashGeneratorTool: React.FC = () => {
  const [input, setInput] = useState("Antigravity Toolbox");
  const [md5, setMd5] = useState("");
  const [sha1, setSha1] = useState("");
  const [sha256, setSha256] = useState("");
  const [sha512, setSha512] = useState("");

  const computeHashes = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    const SparkMD5 = (await import("spark-md5")).default;
    setMd5(SparkMD5.hash(input));

    const buf1 = await crypto.subtle.digest("SHA-1", data);
    setSha1(Array.from(new Uint8Array(buf1)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    const buf256 = await crypto.subtle.digest("SHA-256", data);
    setSha256(Array.from(new Uint8Array(buf256)).map((b) => b.toString(16).padStart(2, "0")).join(""));

    const buf512 = await crypto.subtle.digest("SHA-512", data);
    setSha512(Array.from(new Uint8Array(buf512)).map((b) => b.toString(16).padStart(2, "0")).join(""));
  };

  return (
    <div className="space-y-6">
      <Textarea label="Text Input" value={input} onChange={(e) => setInput(e.target.value)} rows={4} />
      <Button variant="primary" onClick={computeHashes}>Compute Hashes</Button>

      <div className="space-y-4">
        {md5 && (
          <ResultPanel title="MD5 Hash" status="done" copyValue={md5}>
            <pre className="font-mono text-xs break-all">{md5}</pre>
          </ResultPanel>
        )}
        {sha256 && (
          <ResultPanel title="SHA-256 Hash" status="done" copyValue={sha256}>
            <pre className="font-mono text-xs break-all">{sha256}</pre>
          </ResultPanel>
        )}
        {sha1 && (
          <ResultPanel title="SHA-1 Hash" status="done" copyValue={sha1}>
            <pre className="font-mono text-xs break-all">{sha1}</pre>
          </ResultPanel>
        )}
        {sha512 && (
          <ResultPanel title="SHA-512 Hash" status="done" copyValue={sha512}>
            <pre className="font-mono text-xs break-all">{sha512}</pre>
          </ResultPanel>
        )}
      </div>
    </div>
  );
};
