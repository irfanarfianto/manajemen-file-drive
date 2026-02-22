"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useKanban } from "@/hooks/useKanban";
import { KanbanColumn } from "./kanban/KanbanColumn";

const COLUMN_PALETTE = [
  {
    // To Do — Biru indigo
    accent: "bg-indigo-500",
    header: "bg-indigo-500/10 dark:bg-indigo-500/10",
    badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
    card: "hover:border-indigo-400/50 hover:shadow-indigo-100/40 dark:hover:shadow-indigo-900/20",
    addBtn: "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-300 dark:hover:border-indigo-500/30",
    title: "text-indigo-700 dark:text-indigo-300",
  },
  {
    // In Progress — Amber
    accent: "bg-amber-500",
    header: "bg-amber-500/10 dark:bg-amber-500/10",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    card: "hover:border-amber-400/50 hover:shadow-amber-100/40 dark:hover:shadow-amber-900/20",
    addBtn: "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:hover:bg-amber-500/10 dark:hover:text-amber-300 dark:hover:border-amber-500/30",
    title: "text-amber-700 dark:text-amber-300",
  },
  {
    // Done — Emerald
    accent: "bg-emerald-500",
    header: "bg-emerald-500/10 dark:bg-emerald-500/10",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    card: "hover:border-emerald-400/50 hover:shadow-emerald-100/40 dark:hover:shadow-emerald-900/20",
    addBtn: "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300 dark:hover:border-emerald-500/30",
    title: "text-emerald-700 dark:text-emerald-300",
  },
  {
    // Extra — Purple
    accent: "bg-purple-500",
    header: "bg-purple-500/10 dark:bg-purple-500/10",
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300",
    card: "hover:border-purple-400/50 hover:shadow-purple-100/40 dark:hover:shadow-purple-900/20",
    addBtn: "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 dark:hover:bg-purple-500/10 dark:hover:text-purple-300 dark:hover:border-purple-500/30",
    title: "text-purple-700 dark:text-purple-300",
  },
  {
    // Extra — Rose
    accent: "bg-rose-500",
    header: "bg-rose-500/10 dark:bg-rose-500/10",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    card: "hover:border-rose-400/50 hover:shadow-rose-100/40 dark:hover:shadow-rose-900/20",
    addBtn: "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 dark:hover:border-rose-500/30",
    title: "text-rose-700 dark:text-rose-300",
  },
];

export function KanbanBoard() {
  const {
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
    moveTask
  } = useKanban();

  const [showPicker, setShowPicker] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-150 animate-pulse" />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-lg">Memuat Board...</p>
          <p className="text-sm text-muted-foreground italic">&ldquo;Tiap detik berharga dalam rencana.&rdquo;</p>
        </div>
      </div>
    );
  }

  const allColumns = columns.map(c => ({ id: c.id, title: c.title }));

  return (
    <div className="flex flex-col h-full overflow-hidden relative group/board">
      {/* Saving indicator */}
      {saving && (
        <div className="absolute top-4 right-8 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md border rounded-full shadow-lg border-primary/20">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Menyimpan...</span>
          </div>
        </div>
      )}

      {!saving && (
        <div className="absolute top-4 right-8 z-50 opacity-0 group-hover/board:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 px-4 py-2 bg-background/50 backdrop-blur-sm border rounded-full text-muted-foreground">
            <Save className="h-3 w-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Tersimpan otomatis</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 pb-4">
        <div className="flex gap-6 p-6 min-h-[calc(100vh-18rem)]">
          {columns.map((col, idx) => {
            const palette = COLUMN_PALETTE[idx % COLUMN_PALETTE.length];
            return (
              <KanbanColumn
                key={col.id}
                col={col}
                palette={palette}
                allColumns={allColumns}
                
                newTaskContent={newTaskContent[col.id]}
                setNewTaskContent={(val) => setNewTaskContent(prev => ({ ...prev, [col.id]: val }))}
                
                pendingFile={pendingFile[col.id]}
                setPendingFile={(file) => setPendingFile(prev => ({ ...prev, [col.id]: file }))}
                
                deadlineType={deadlineType[col.id] || "single"}
                setDeadlineType={(type) => setDeadlineType(prev => ({ ...prev, [col.id]: type }))}
                
                deadlineStart={deadlineStart[col.id] || ""}
                setDeadlineStart={(date) => setDeadlineStart(prev => ({ ...prev, [col.id]: date }))}
                
                deadlineEnd={deadlineEnd[col.id] || ""}
                setDeadlineEnd={(date) => setDeadlineEnd(prev => ({ ...prev, [col.id]: date }))}
                
                onAddTask={addTask}
                onDeleteTask={deleteTask}
                onMoveTask={moveTask}
                onDetachFile={detachFile}
                onAttachFile={attachFileToTask}
                onUpdateDeadline={updateTaskDeadline}
                
                showPicker={showPicker === col.id}
                setShowPicker={(show) => setShowPicker(show ? col.id : null)}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
