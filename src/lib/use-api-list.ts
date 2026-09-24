"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "./api";
import { formatApiError } from "./auth-context";

// Faqat parallel ketayotgan bir xil so'rovlarni deduplication qilish uchun
const activeRequests = new Map<string, Promise<any>>();

export function useApiList<T>(path: string | null, options?: { immediate?: boolean }) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(path) && options?.immediate !== false);
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
      let requestPromise: Promise<T[]>;

      // Bir vaqtda ketgan bir xil URL so'rovlarini bittaga birlashtiramiz
      if (activeRequests.has(path)) {
        requestPromise = activeRequests.get(path)!;
      } else {
        requestPromise = apiGet<T[]>(path);
        activeRequests.set(path, requestPromise);
      }

      const res = await requestPromise;

      if (requestId !== requestIdRef.current) return;

      const result = Array.isArray(res) ? res : [];
      setData(result);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(formatApiError(err));
    } finally {
      if (activeRequests.has(path)) {
        activeRequests.delete(path);
      }
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [path]);

  useEffect(() => {
    if (options?.immediate !== false && path) {
      void reload();
    }
  }, [path, options?.immediate]);

  return { data, loading, error, reload, setData };
}