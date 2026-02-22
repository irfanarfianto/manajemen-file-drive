"use client";

import { useState } from "react";
import { 
  MoreVertical, 
  Trash2, 
  ArrowRight, 
  Paperclip, 
  ExternalLink, 
  Calendar,
  CalendarDays,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { FileIcon } from "@/components/ui/FileIcon";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Task, AttachedFile } from "@/lib/kanban-types";
import { formatDate, openFile } from "@/lib/kanban-utils";
import { KanbanFilePicker } from "./KanbanFilePicker";

interface KanbanCardProps {
  task: Task;
  colId: string;
  palette: {
    accent: string;
    header: string;
    badge: string;
    card: string;
    addBtn: string;
    title: string;
  };
  onDelete: (colId: string, taskId: string) => void;
  onMove: (taskId: string, sourceColId: string, targetColId: string) => void;
  onDetachFile: (colId: string, taskId: string) => void;
  onAttachFile: (colId: string, taskId: string, file: AttachedFile) => void;
  onUpdateDeadline: (colId: string, taskId: string, deadline: string, type: "single" | "range") => void;
  allColumns: { id: string, title: string }[];
}

export function KanbanCard({
  task,
  colId,
  palette,
  onDelete,
  onMove,
  onDetachFile,
  onAttachFile,
  onUpdateDeadline,
  allColumns
}: KanbanCardProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [tempDeadlineStart, setTempDeadlineStart] = useState("");
  const [tempDeadlineEnd, setTempDeadlineEnd] = useState("");

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("sourceColId", colId);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group mb-3 cursor-grab active:cursor-grabbing border-slate-200/60 dark:border-slate-800/60 transition-all duration-300",
        palette.card
      )}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-medium flex-1 break-words">{task.content}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
              <DropdownMenuItem onClick={() => setEditingDeadline(true)}>
                <Calendar className="mr-2 h-4 w-4" /> Edit Deadline
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowPicker(true)}>
                <Paperclip className="mr-2 h-4 w-4" /> Lampirkan File
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pindah Ke</div>
              {allColumns.filter(c => c.id !== colId).map(c => (
                <DropdownMenuItem key={c.id} onClick={() => onMove(task.id, colId, c.id)}>
                   <ArrowRight className="mr-2 h-4 w-4" /> {c.title}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(colId, task.id)}>
                <Trash2 className="mr-2 h-4 w-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.deadline && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight",
              palette.badge
            )}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.deadline)}
            </div>
          </div>
        )}

        {task.file && (
          <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-slate-200/50 dark:border-slate-800/50 group/file">
            <FileIcon mimeType={task.file.mimeType} className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="text-[10px] font-medium truncate flex-1">{task.file.fileName}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
              <button onClick={() => openFile(task.file!)} className="p-1 hover:text-primary transition-colors">
                <ExternalLink className="h-3 w-3" />
              </button>
              <button onClick={() => onDetachFile(colId, task.id)} className="p-1 hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        {editingDeadline && (
          <div className="mt-3 p-3 bg-muted/40 rounded-xl space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ubah Deadline</p>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 justify-start text-left font-normal text-[10px] px-2 bg-muted/20 border-none"
                  >
                    <Calendar className="mr-2 h-3 w-3" />
                    {tempDeadlineStart 
                      ? format(new Date(tempDeadlineStart), "dd MMM yyyy", { locale: id }) 
                      : (task.deadline ? format(new Date(task.deadline.split(" - ")[0]), "dd MMM yyyy", { locale: id }) : "Pilih")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={tempDeadlineStart ? new Date(tempDeadlineStart) : (task.deadline ? new Date(task.deadline.split(" - ")[0]) : undefined)}
                    onSelect={(date) => setTempDeadlineStart(date ? date.toISOString() : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {task.deadlineType === "range" && (
                <>
                  <span className="text-[10px]">-</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 flex-1 justify-start text-left font-normal text-[10px] px-2 bg-muted/20 border-none"
                      >
                        <CalendarDays className="mr-2 h-3 w-3" />
                        {tempDeadlineEnd 
                          ? format(new Date(tempDeadlineEnd), "dd MMM yyyy", { locale: id }) 
                          : (task.deadline?.includes(" - ") ? format(new Date(task.deadline.split(" - ")[1]), "dd MMM yyyy", { locale: id }) : "Selesai")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={tempDeadlineEnd ? new Date(tempDeadlineEnd) : (task.deadline?.includes(" - ") ? new Date(task.deadline.split(" - ")[1]) : undefined)}
                        onSelect={(date) => setTempDeadlineEnd(date ? date.toISOString() : "")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-7 text-[10px] flex-1" onClick={() => {
                const start = tempDeadlineStart || (task.deadline ? task.deadline.split(" - ")[0] : "");
                const end = tempDeadlineEnd || (task.deadline?.includes(" - ") ? task.deadline.split(" - ")[1] : "");
                const type = task.deadlineType || "single";
                let dl = start;
                if (type === "range" && start && end) dl = `${start} - ${end}`;
                onUpdateDeadline(colId, task.id, dl, type);
                setEditingDeadline(false);
              }}>Simpan</Button>
              <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setEditingDeadline(false)}>Batal</Button>
            </div>
          </div>
        )}

        {showPicker && (
          <div className="mt-3">
            <KanbanFilePicker
              onSelect={(f) => {
                onAttachFile(colId, task.id, f);
                setShowPicker(false);
              }}
              onCancel={() => setShowPicker(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
