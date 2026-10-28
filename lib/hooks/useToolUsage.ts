"use client";

import { useCallback, useEffect, useState } from "react";

export function useToolUsage(toolId: string, initialCount = 0) {
  const [usageCount, setUsageCount] = useState(initialCount);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`/api/tools/${toolId}/use`, {
        cache: "no-store",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { usageCount?: number };
      if (typeof data.usageCount === "number") {
        setUsageCount(data.usageCount);
      }
    } catch {
      // ignore transient network errors
    }
  }, [toolId]);

  const recordUse = useCallback(async () => {
    try {
      const response = await fetch(`/api/tools/${toolId}/use`, {
        method: "POST",
      });
      if (!response.ok) return null;
      const data = (await response.json()) as { usageCount?: number };
      if (typeof data.usageCount === "number") {
        setUsageCount(data.usageCount);
        return data.usageCount;
      }
      return null;
    } catch {
      return null;
    }
  }, [toolId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const response = await fetch(`/api/tools/${toolId}/use`, {
          method: "POST",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { usageCount?: number };
        if (!cancelled && typeof data.usageCount === "number") {
          setUsageCount(data.usageCount);
        }
      } catch {
        // ignore transient network errors
      }
    }

    void run();

    const timer = window.setInterval(() => {
      void refresh();
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [toolId, refresh]);

  return { usageCount, recordUse, refresh };
}
