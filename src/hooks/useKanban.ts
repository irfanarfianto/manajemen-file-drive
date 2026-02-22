"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Column, Task, AttachedFile } from "@/lib/kanban-types";

export function useKanban() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Local states for new tasks
  const [newTaskContent, setNewTaskContent] = useState<Record<string, string | undefined>>({});
  const [pendingFile, setPendingFile] = useState<Record<string, AttachedFile | null>>({});
  const [deadlineType, setDeadlineType] = useState<Record<string, "single" | "range">>({});
  const [deadlineStart, setDeadlineStart] = useState<Record<string, string>>({});
  const [deadlineEnd, setDeadlineEnd] = useState<Record<string, string>>({});

  const fetchKanban = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/kanban");
      if (!res.ok) throw new Error("Gagal memuat kanban");
      const data = await res.json();
      setColumns(data.columns || []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveKanban = useCallback(async (newCols: Column[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/drive/kanban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: newCols }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateColumns = useCallback((newCols: Column[]) => {
    setColumns(newCols);
    saveKanban(newCols);
  }, [saveKanban]);

  const addTask = useCallback((colId: string) => {
    const content = newTaskContent[colId]?.trim();
    if (!content) return;
    const file = pendingFile[colId] ?? undefined;
    
    let deadline = "";
    const type = deadlineType[colId] || "single";
    if (type === "single" && deadlineStart[colId]) {
      deadline = deadlineStart[colId];
    } else if (type === "range" && deadlineStart[colId] && deadlineEnd[colId]) {
      deadline = `${deadlineStart[colId]} - ${deadlineEnd[colId]}`;
    }

    const newCols = columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: [...col.tasks, { 
            id: Date.now().toString(), 
            content, 
            file, 
            deadline: deadline || undefined,
            deadlineType: type 
          }],
        };
      }
      return col;
    });

    updateColumns(newCols);
    
    // Reset local state for this column
    setNewTaskContent(prev => ({ ...prev, [colId]: undefined }));
    setPendingFile(prev => ({ ...prev, [colId]: null }));
    setDeadlineStart(prev => ({ ...prev, [colId]: "" }));
    setDeadlineEnd(prev => ({ ...prev, [colId]: "" }));
  }, [columns, newTaskContent, pendingFile, deadlineType, deadlineStart, deadlineEnd, updateColumns]);

  const deleteTask = useCallback((colId: string, taskId: string) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
      }
      return col;
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const detachFile = useCallback((colId: string, taskId: string) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, file: undefined } : t) };
      }
      return col;
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const attachFileToTask = useCallback((colId: string, taskId: string, file: AttachedFile) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, file } : t) };
      }
      return col;
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const updateTaskDeadline = useCallback((colId: string, taskId: string, deadline: string, type: "single" | "range") => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, deadline, deadlineType: type } : t) };
      }
      return col;
    });
    updateColumns(newCols);
  }, [columns, updateColumns]);

  const moveTask = useCallback((taskId: string, sourceColId: string, targetColId: string) => {
    if (sourceColId === targetColId) return;

    let taskToMove: Task | null = null;
    const newCols = columns.map(col => {
      if (col.id === sourceColId) {
        const found = col.tasks.find(t => t.id === taskId);
        if (found) taskToMove = found;
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
      }
      return col;
    }).map(col => {
      if (col.id === targetColId && taskToMove) {
        return { ...col, tasks: [...col.tasks, taskToMove] };
      }
      return col;
    });

    updateColumns(newCols);
  }, [columns, updateColumns]);

  useEffect(() => {
    fetchKanban();
  }, [fetchKanban]);

  return {
    columns,
    loading,
    saving,
    newTaskContent,
    setNewTaskContent,
    pendingFile,
    setPendingFile,
    deadlineType,
    setDeadlineType,
    deadlineStart,
    setDeadlineStart,
    deadlineEnd,
    setDeadlineEnd,
    addTask,
    deleteTask,
    detachFile,
    attachFileToTask,
    updateTaskDeadline,
    moveTask,
    refresh: fetchKanban
  };
}
