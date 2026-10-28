// Keep this explicit public availability policy synchronized with the dispatcher.
// tests/seo.test.ts checks every registry ID against the actual switch cases.
export const pendingToolIds: readonly string[] = [];
const pending = new Set<string>(pendingToolIds);
export function isImplementedTool(id: string) { return !pending.has(id); }
