"use client";

import { useState, useEffect, useCallback } from "react";

export interface KanbanTask {
  id: string;
  content: string;
  description?: string;
  deadline?: string;
  deadlineEnd?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

export interface KanbanData {
  columns: KanbanColumn[];
}

export function useKanban() {
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKanban = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive/kanban");
      if (!res.ok) throw new Error("Gagal mengambil data Kanban");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  return { data, loading, error, refetch: fetchKanban };
}
