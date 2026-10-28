"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Login failed");
      }

      router.replace("/admin/tools");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-16 w-full max-w-md rounded-[14px] border border-[var(--line)] bg-[var(--surface)] p-6"
    >
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-faint)]">
        Admin
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
        Sign in
      </h1>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">
        Manage which tools are visible on the public site.
      </p>

      <div className="mt-6">
        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

      <Button type="submit" className="mt-5" fullWidth loading={loading}>
        Enter admin
      </Button>
    </form>
  );
}
