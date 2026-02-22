"use client";

import { Plus, Paperclip, Calendar, CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { FileIcon } from "@/components/ui/FileIcon";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Column, AttachedFile } from "@/lib/kanban-types";
import { KanbanCard } from "./KanbanCard";
import { KanbanFilePicker } from "./KanbanFilePicker";

interface KanbanColumnProps {
  col: Column;
  palette: {
    accent: string;
    header: string;
    badge: string;
    card: string;
    addBtn: string;
    title: string;
  };
  allColumns: { id: string, title: string }[];
  
  // States and setters (from useKanban)
  newTaskContent: string | undefined;
  setNewTaskContent: (content: string | undefined) => void;
  pendingFile: AttachedFile | null | undefined;
  setPendingFile: (file: AttachedFile | null) => void;
  deadlineType: "single" | "range";
  setDeadlineType: (type: "single" | "range") => void;
  deadlineStart: string;
  setDeadlineStart: (date: string) => void;
  deadlineEnd: string;
  setDeadlineEnd: (date: string) => void;
  
  // Actions
  onAddTask: (colId: string) => void;
  onDeleteTask: (colId: string, taskId: string) => void;
  onMoveTask: (taskId: string, sourceColId: string, targetColId: string) => void;
  onDetachFile: (colId: string, taskId: string) => void;
  onAttachFile: (colId: string, taskId: string, file: AttachedFile) => void;
  onUpdateDeadline: (colId: string, taskId: string, deadline: string, type: "single" | "range") => void;

  // Local UI states managed by parent but can be simplified if moved here
  showPicker: boolean;
  setShowPicker: (show: boolean) => void;
}

export function KanbanColumn({
  col,
  palette,
  allColumns,
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
  onAddTask,
  onDeleteTask,
  onMoveTask,
  onDetachFile,
  onAttachFile,
  onUpdateDeadline,
  showPicker,
  setShowPicker
}: KanbanColumnProps) {

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColId = e.dataTransfer.getData("sourceColId");
    if (taskId && sourceColId) {
      onMoveTask(taskId, sourceColId, col.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden group/column shadow-sm"
    >
      <div className={cn("p-4 border-b flex items-center justify-between", palette.header)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-6 rounded-full", palette.accent)} />
          <h2 className={cn("font-bold text-sm tracking-tight", palette.title)}>{col.title}</h2>
        </div>
        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest", palette.badge)}>
          {col.tasks.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {col.tasks.map(task => (
           <KanbanCard
             key={task.id}
             task={task}
             colId={col.id}
             palette={palette}
             allColumns={allColumns}
             onDelete={onDeleteTask}
             onMove={onMoveTask}
             onDetachFile={onDetachFile}
             onAttachFile={onAttachFile}
             onUpdateDeadline={onUpdateDeadline}
           />
        ))}

        <div className="pt-2">
          {newTaskContent !== undefined ? (
            <div className="p-3 border rounded-xl bg-card shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <Input
                autoFocus
                className="text-sm shadow-none focus-visible:ring-1 bg-muted/40"
                placeholder="Ketik tugas baru..."
                value={newTaskContent || ""}
                onChange={(e) => setNewTaskContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onAddTask(col.id);
                  }
                  if (e.key === "Escape") {
                    setNewTaskContent(""); // This is a bit tricky since undefined means "form closed"
                  }
                }}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deadline</label>
                  <div className="flex bg-muted rounded-lg p-0.5 scale-90 origin-right">
                    <button
                      onClick={() => setDeadlineType("single")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] rounded-md transition-all",
                        (deadlineType || "single") === "single" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Tunggal
                    </button>
                    <button
                      onClick={() => setDeadlineType("range")}
                      className={cn(
                        "px-2 py-0.5 text-[10px] rounded-md transition-all",
                        deadlineType === "range" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                      )}
                    >
                      Rentang
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-2 items-center">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "h-8 flex-1 justify-start text-left font-normal text-[11px] px-2 bg-muted/20 border-none",
                          !deadlineStart && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-3.5 w-3.5" />
                        {deadlineStart ? format(new Date(deadlineStart), "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={deadlineStart ? new Date(deadlineStart) : undefined}
                        onSelect={(date) => setDeadlineStart(date ? date.toISOString() : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {deadlineType === "range" && (
                    <>
                      <span className="text-muted-foreground text-xs">-</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 flex-1 justify-start text-left font-normal text-[11px] px-2 bg-muted/20 border-none",
                              !deadlineEnd && "text-muted-foreground"
                            )}
                          >
                            <CalendarDays className="mr-2 h-3.5 w-3.5" />
                            {deadlineEnd ? format(new Date(deadlineEnd), "dd MMM yyyy", { locale: id }) : "Selesai"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={deadlineEnd ? new Date(deadlineEnd) : undefined}
                            onSelect={(date) => setDeadlineEnd(date ? date.toISOString() : "")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
              </div>

              {pendingFile ? (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5">
                  <FileIcon mimeType={pendingFile.mimeType} className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs truncate flex-1 text-primary">{pendingFile.fileName}</span>
                  <button onClick={() => setPendingFile(null)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ) : showPicker ? (
                <KanbanFilePicker
                  onSelect={(f) => {
                    setPendingFile(f);
                    setShowPicker(false);
                  }}
                  onCancel={() => setShowPicker(false)}
                />
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <Paperclip className="h-3.5 w-3.5" /> Lampirkan file dari Drive
                </button>
              )}

              <div className="flex gap-2">
                <Button size="sm" className="w-full text-xs h-8" onClick={() => onAddTask(col.id)}>Simpan</Button>
                <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => setNewTaskContent(undefined)}>Batal</Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-muted-foreground transition-colors border border-dashed border-transparent bg-muted/20",
                palette.addBtn
              )}
              onClick={() => setNewTaskContent("")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Tugas
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
