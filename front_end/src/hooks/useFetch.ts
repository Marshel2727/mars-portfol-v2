"use client";

// [BARU] ✅ DRY: Custom hook untuk menggantikan pola berulang:
// const [data, setData] = useState([]);
// const [isLoading, setIsLoading] = useState(true);
// useEffect(() => { setIsLoading(true); try { ... } finally { setIsLoading(false); } }, []);
// Dipakai di: admin/page.tsx, admin/messages/page.tsx, admin/projects/page.tsx, admin/skills/page.tsx

import { useState, useEffect, useCallback } from "react";

export function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetcher();
      setData(result);
    } catch (error) {
      console.error("useFetch error:", error);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, reload: load };
}
