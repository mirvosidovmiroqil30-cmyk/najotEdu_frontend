"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "./api";
import { formatApiError } from "./auth-context";

export function useApiList<T>(path: string | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    if (!path) {
      setData([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const res = await apiGet<T[]>(path);
      if (requestId !== requestIdRef.current) return;
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(formatApiError(err));
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
