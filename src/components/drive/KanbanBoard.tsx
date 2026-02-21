"use client";

import { useState, useEffect } from "react";
import { Plus, MoreVertical, Trash2, ArrowRight, ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  content: string;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchKanban();
  }, []);

  const fetchKanban = async () => {
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
  };

  const saveKanban = async (newCols: Column[]) => {
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
  };

  const updateColumns = (newCols: Column[]) => {
    setColumns(newCols);
    saveKanban(newCols);
  };

  const addTask = (colId: string) => {
    const content = newTaskContent[colId]?.trim();
    if (!content) return;
    
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: [...col.tasks, { id: Date.now().toString(), content }],
        };
      }
      return col;
    });
    setNewTaskContent({ ...newTaskContent, [colId]: "" });
    updateColumns(newCols);
  };

  const deleteTask = (colId: string, taskId: string) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
      }
      return col;
    });
    updateColumns(newCols);
  };

  const moveTask = (taskId: string, sourceColId: string, targetColId: string) => {
    let taskToMove: Task | null = null;
    let newCols = columns.map(col => {
      if (col.id === sourceColId) {
        const tIndex = col.tasks.findIndex(t => t.id === taskId);
        if (tIndex > -1) {
          taskToMove = col.tasks[tIndex];
          const newTasks = [...col.tasks];
          newTasks.splice(tIndex, 1);
          return { ...col, tasks: newTasks };
        }
      }
      return col;
    });

    if (taskToMove) {
      newCols = newCols.map(col => {
        if (col.id === targetColId) {
          return { ...col, tasks: [...col.tasks, taskToMove!] };
        }
        return col;
      });
      updateColumns(newCols);
    }
  };
  
  // Basic Drag and Drop implementation
  const onDragStart = (e: React.DragEvent, taskId: string, colId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("colId", colId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColId = e.dataTransfer.getData("colId");
    if (sourceColId && taskId && sourceColId !== targetColId) {
      moveTask(taskId, sourceColId, targetColId);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
        <p className="text-muted-foreground font-medium">Memuat dan mensinkronkan papan tugas dari Google Drive...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fc] dark:bg-muted/10">
      <div className="flex items-center justify-between px-8 py-5 border-b bg-card/40 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Kanban Tugas 
            {saving ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full"><Loader2 className="h-3 w-3 animate-spin"/> Menyimpan...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-primary/5 text-primary px-2 py-1 rounded-full"><Save className="h-3 w-3"/> Sinkron ke Drive</span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Kelola progres dan target belajarmu dengan praktis tanpa verifikasi ulang.</p>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-8 flex gap-6 items-start h-full pb-10">
          {columns.map((col, colIndex) => (
            <div 
              key={col.id} 
              className="flex-shrink-0 w-[320px] bg-card/60 backdrop-blur-sm border shadow-sm rounded-xl flex flex-col min-h-[500px]"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              <div className="p-4 bg-muted/30 flex items-center justify-between rounded-t-xl border-b">
                <h3 className="font-bold text-[15px]">{col.title} <span className="ml-2 text-xs font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{col.tasks.length}</span></h3>
              </div>
              
              <div className="flex-1 p-3 space-y-3">
                {col.tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => onDragStart(e, task.id, col.id)}
                    className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all hover:border-primary/30 border-muted"
                  >
                    <CardContent className="p-3 flex gap-2 justify-between items-start group">
                      <p className="text-[13px] whitespace-pre-wrap flex-1 leading-relaxed text-foreground/90">{task.content}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-1 -mt-1 bg-muted/50 hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {colIndex > 0 && (
                            <DropdownMenuItem onClick={() => moveTask(task.id, col.id, columns[colIndex - 1].id)}>
                              <ArrowLeft className="mr-2 h-4 w-4" /> Pindah ke {columns[colIndex - 1].title}
                            </DropdownMenuItem>
                          )}
                          {colIndex < columns.length - 1 && (
                            <DropdownMenuItem onClick={() => moveTask(task.id, col.id, columns[colIndex + 1].id)}>
                              <ArrowRight className="mr-2 h-4 w-4" /> Pindah ke {columns[colIndex + 1].title}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => deleteTask(col.id, task.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="pt-2">
                  {newTaskContent[col.id] !== undefined ? (
                    <div className="p-3 border rounded-xl bg-card shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-200">
                      <Input
                        autoFocus
                        className="text-sm shadow-none focus-visible:ring-1 bg-muted/40"
                        placeholder="Ketik tugas baru..."
                        value={newTaskContent[col.id] || ""}
                        onChange={(e) => setNewTaskContent({ ...newTaskContent, [col.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTask(col.id);
                          if (e.key === "Escape") {
                            const updated = { ...newTaskContent };
                            delete updated[col.id];
                            setNewTaskContent(updated);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="w-full text-xs h-8" onClick={() => addTask(col.id)}>Simpan</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => {
                          const updated = { ...newTaskContent };
                          delete updated[col.id];
                          setNewTaskContent(updated);
                        }}>Batal</Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-muted-foreground hover:bg-primary/5 hover:text-primary transition-colors border border-dashed border-transparent hover:border-primary/20 bg-muted/20"
                      onClick={() => setNewTaskContent({ ...newTaskContent, [col.id]: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Tugas
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
