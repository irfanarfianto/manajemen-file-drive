"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { DriveFile } from "@/lib/drive-types";

interface UseDriveFilesOptions {
  folderId?: string;
  enabled?: boolean;
  orderBy?: string;
}

interface UseDriveFilesResult {
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  nextPageToken?: string;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

export function useDriveFiles(
  options: UseDriveFilesOptions = {}
): UseDriveFilesResult {
  const { folderId = "root", enabled = true, orderBy } = options;
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFiles = useCallback(
    async (pageToken?: string, append = false) => {
      if (!enabled) return;

      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      if (!append) setError(null);

      try {
        const params = new URLSearchParams({ folderId });
        if (pageToken) params.set("pageToken", pageToken);
        if (orderBy) params.set("orderBy", orderBy);

        const res = await fetch(`/api/drive/files?${params}`, {
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to fetch files");
        }

        const data = await res.json();

        setFiles((prev) => (append ? [...prev, ...data.files] : data.files));
        setNextPageToken(data.nextPageToken);
        setHasMore(!!data.nextPageToken);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [folderId, enabled]
  );

  useEffect(() => {
    setFiles([]);
    setNextPageToken(undefined);
    fetchFiles();
    return () => abortRef.current?.abort();
  }, [fetchFiles]);

  const refetch = useCallback(() => {
    setFiles([]);
    setNextPageToken(undefined);
    fetchFiles();
  }, [fetchFiles]);

  const loadMore = useCallback(() => {
    if (nextPageToken && !loading) {
      fetchFiles(nextPageToken, true);
    }
  }, [fetchFiles, nextPageToken, loading]);

  return { files, loading, error, nextPageToken, refetch, loadMore, hasMore };
}

// =============================================
// Hook: Search files globally
// =============================================
export function useDriveSearch(query: string, debounceMs = 400) {
  const [results, setResults] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/drive/files?q=${encodeURIComponent(query)}`,
          { signal: abortRef.current.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.files ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  return { results, loading, error };
}

// =============================================
// Hook: Storage quota
// =============================================
export function useDriveQuota() {
  const [quota, setQuota] = useState<{
    limit: number | null;
    usage: number;
    usageInDrive: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuota = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/drive/quota");
      const data = await r.json();
      setQuota(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
  }, [fetchQuota]);

  return { quota, loading, refetch: fetchQuota };
}

