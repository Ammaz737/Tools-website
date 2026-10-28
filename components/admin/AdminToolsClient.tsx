"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { categories, type Category } from "@/lib/tools";

interface AdminToolRow {
  id: string;
  name: string;
  category: Category;
  runtime: "client" | "server";
  blurb: string;
  isActive: boolean;
  maintenance: boolean;
  maxInputChars?: number;
  maxFileSizeMB?: number;
  timeoutMs?: number;
  usageCount: number;
}

interface AdminToolsClientProps {
  mongoConfigured: boolean;
}

export function AdminToolsClient({ mongoConfigured }: AdminToolsClientProps) {
  const router = useRouter();
  const [tools, setTools] = useState<AdminToolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const response = await fetch("/api/admin/tools", { cache: "no-store" });
        if (response.status === 401) {
          router.replace("/admin");
          return;
        }
        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error || "Failed to load tools");
        }
        const data = (await response.json()) as { tools: AdminToolRow[] };
        if (!cancelled) {
          setTools(data.tools);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tools");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [router]);

  async function toggleTool(toolId: string, isActive: boolean) {
    setPendingId(toolId);
    setError(null);
    setTools((current) =>
      current.map((tool) =>
        tool.id === toolId ? { ...tool, isActive } : tool,
      ),
    );

    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Failed to update tool");
      }
    } catch (err) {
      setTools((current) =>
        current.map((tool) =>
          tool.id === toolId ? { ...tool, isActive: !isActive } : tool,
        ),
      );
      setError(err instanceof Error ? err.message : "Failed to update tool");
    } finally {
      setPendingId(null);
    }
  }

  async function saveSetting(toolId: string, setting: string, value: number | boolean) {
    setPendingId(toolId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [setting]: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save setting");
      setTools((current) => current.map((tool) => tool.id === toolId ? { ...tool, ...data } : tool));
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to save setting"); }
    finally { setPendingId(null); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
    router.refresh();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) return false;
      if (!q) return true;
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.id.toLowerCase().includes(q) ||
        tool.blurb.toLowerCase().includes(q)
      );
    });
  }, [tools, query, category]);

  const activeCount = tools.filter((tool) => tool.isActive).length;
  const totalUses = tools.reduce((sum, tool) => sum + tool.usageCount, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
            Admin
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
            Tool visibility
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--ink-soft)]">
            Toggle tools on or off for the public site. Usage counts update as
            visitors open each tool.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void logout()}>
          Log out
        </Button>
      </div>

      {!mongoConfigured && (
        <div className="mt-6 rounded-[14px] border border-[var(--warn)]/40 bg-[var(--surface)] px-4 py-3 text-sm text-[var(--ink-soft)]">
          MongoDB is not configured yet. Add `MONGODB_URI` and `ADMIN_PASSWORD`
          to `.env.local` for persistent toggles and usage counts.
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            Active tools
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--ink)]">
            {activeCount}/{tools.length}
          </p>
        </div>
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            Total uses
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--ink)]">
            {totalUses.toLocaleString()}
          </p>
        </div>
        <div className="rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--ink-faint)]">
            Showing
          </p>
          <p className="mt-2 font-mono text-2xl text-[var(--ink)]">
            {filtered.length}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 md:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tools..."
          className="md:flex-1"
        />
        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as Category | "all")
          }
          className="h-10 rounded-[10px] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)]"
        >
          <option value="all">All categories</option>
          {categories.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-4 text-sm text-[var(--danger)]">{error}</p>
      )}

      <div className="mt-6 overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--surface)]">
        {loading ? (
          <p className="p-6 text-sm text-[var(--ink-soft)]">Loading tools…</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {filtered.map((tool) => (
              <li
                key={tool.id}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-[var(--ink)]">{tool.name}</h2>
                    <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--ink-faint)]">
                      {tool.category}
                    </span>
                    <span className="rounded-full bg-[var(--surface-sunk)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--ink-faint)]">
                      {tool.runtime}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--ink-soft)]">
                    {tool.blurb}
                  </p>
                  <p className="mt-2 font-mono text-xs text-[var(--ink-faint)]">
                    {tool.id} · {tool.usageCount.toLocaleString()} uses
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Toggle checked={tool.maintenance} disabled={pendingId === tool.id || !mongoConfigured} onChange={(value) => void saveSetting(tool.id, "maintenance", value)} label="Maintenance" description="Pause public access" />
                  {tool.runtime === "server" && <label className="text-xs text-[var(--ink-soft)]">Input characters
                    <input aria-label={`${tool.name} input character limit`} type="number" min="1" max="1000000" defaultValue={tool.maxInputChars ?? ""} disabled={pendingId === tool.id || !mongoConfigured} className="ml-2 w-24 rounded border border-[var(--line)] p-1" onBlur={(event) => { const value = Number(event.target.value); if (event.target.value && value !== tool.maxInputChars) void saveSetting(tool.id, "maxInputChars", value); }} />
                  </label>}
                  {tool.runtime === "server" && <>
                    <label className="text-xs text-[var(--ink-soft)]">AI/network timeout (ms)
                      <input aria-label={`${tool.name} timeout milliseconds`} type="number" min="1000" max="120000" step="1000" defaultValue={tool.timeoutMs ?? ""} disabled={pendingId === tool.id || !mongoConfigured} className="ml-2 w-24 rounded border border-[var(--line)] p-1" onBlur={(event) => { const value = Number(event.target.value); if (event.target.value && value !== tool.timeoutMs) void saveSetting(tool.id, "timeoutMs", value); }} />
                    </label>
                    <p className="w-full text-xs text-[var(--ink-faint)]">Timeouts apply to supported AI and network operations. Browser-only processing uses its own limits. Changes save when leaving a field.</p>
                  </>}
                <Toggle
                  checked={tool.isActive}
                  disabled={pendingId === tool.id || !mongoConfigured}
                  onChange={(checked) => void toggleTool(tool.id, checked)}
                  label={tool.isActive ? "Active" : "Inactive"}
                  description={
                    tool.isActive ? "Visible on client" : "Hidden from client"
                  }
                />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
