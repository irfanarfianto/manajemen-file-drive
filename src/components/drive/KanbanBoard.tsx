"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, MoreVertical, Trash2, ArrowRight, ArrowLeft,
  Loader2, Save, Paperclip, X, ExternalLink, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from "@/components/ui/FileIcon";
import { cn } from "@/lib/utils";

interface AttachedFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink?: string;
}

interface Task {
  id: string;
  content: string;
  file?: AttachedFile;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

// ─── File picker popup ────────────────────────────────────────────────────
interface DriveFilePick {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

function FilePicker({
  onSelect,
  onCancel,
}: {
  onSelect: (f: AttachedFile) => void;
  onCancel: () => void;
}) {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<DriveFilePick[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folderId: "root" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/drive/files?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // filter folder
      setFiles((data.files || []).filter((f: DriveFilePick) => f.mimeType !== "application/vnd.google-apps.folder"));
    } catch {
      toast.error("Gagal mengambil daftar file");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search("");
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 400);
  };

  return (
    <div className="border rounded-xl bg-card shadow-lg mt-2 overflow-hidden">
      <div className="p-2 border-b flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          autoFocus
          placeholder="Cari file di Drive..."
          className="text-sm flex-1 bg-transparent outline-none"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
        />
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="h-48">
        {loading ? (
          <div className="flex justify-center pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">Tidak ada file ditemukan</p>
        ) : (
          <div className="p-1">
            {files.map(f => (
              <button
                key={f.id}
                onClick={() => onSelect({ fileId: f.id, fileName: f.name, mimeType: f.mimeType, webViewLink: f.webViewLink })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FileIcon mimeType={f.mimeType} className="h-5 w-5 flex-shrink-0" />
                <span className="text-xs truncate flex-1">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────

// Palette warna per kolom — cycling jika kolom lebih dari yang didefinisikan
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
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTaskContent, setNewTaskContent] = useState<Record<string, string>>({});
  const [pendingFile, setPendingFile] = useState<Record<string, AttachedFile | null>>({});
  const [showPicker, setShowPicker] = useState<string | null>(null); // colId

  // Navigate to preview (same logic as dashboard)
  const OFFICE_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ]);

  const openFile = (f: AttachedFile) => {
    if (OFFICE_TYPES.has(f.mimeType) && f.webViewLink) {
      window.open(f.webViewLink, "_blank", "noopener,noreferrer");
    } else {
      const params = new URLSearchParams({ fileId: f.fileId, fileName: f.fileName, mimeType: f.mimeType, webViewLink: f.webViewLink || "" });
      window.open(`/dashboard/preview?${params}`, "_blank");
    }
  };

  useEffect(() => { fetchKanban(); }, []);

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
    const file = pendingFile[colId] ?? undefined;

    const newCols = columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          tasks: [...col.tasks, { id: Date.now().toString(), content, file }],
        };
      }
      return col;
    });
    setNewTaskContent({ ...newTaskContent, [colId]: "" });
    setPendingFile({ ...pendingFile, [colId]: null });
    setShowPicker(null);
    updateColumns(newCols);
  };

  const deleteTask = (colId: string, taskId: string) => {
    updateColumns(columns.map(col =>
      col.id === colId ? { ...col, tasks: col.tasks.filter(t => t.id !== taskId) } : col
    ));
  };

  const detachFile = (colId: string, taskId: string) => {
    updateColumns(columns.map(col =>
      col.id === colId
        ? { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, file: undefined } : t) }
        : col
    ));
  };

  const attachFileToTask = (colId: string, taskId: string, file: AttachedFile) => {
    updateColumns(columns.map(col =>
      col.id === colId
        ? { ...col, tasks: col.tasks.map(t => t.id === taskId ? { ...t, file } : t) }
        : col
    ));
  };

  const moveTask = (taskId: string, sourceColId: string, targetColId: string) => {
    let taskToMove: Task | null = null;
    let newCols = columns.map(col => {
      if (col.id === sourceColId) {
        const idx = col.tasks.findIndex(t => t.id === taskId);
        if (idx > -1) {
          taskToMove = col.tasks[idx];
          const tasks = [...col.tasks];
          tasks.splice(idx, 1);
          return { ...col, tasks };
        }
      }
      return col;
    });
    if (taskToMove) {
      newCols = newCols.map(col =>
        col.id === targetColId ? { ...col, tasks: [...col.tasks, taskToMove!] } : col
      );
      updateColumns(newCols);
    }
  };

  const onDragStart = (e: React.DragEvent, taskId: string, colId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("colId", colId);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const sourceColId = e.dataTransfer.getData("colId");
    if (sourceColId && taskId && sourceColId !== targetColId) moveTask(taskId, sourceColId, targetColId);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50 mb-4" />
        <p className="text-muted-foreground font-medium">Memuat papan tugas dari Google Drive...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f7fc] dark:bg-muted/10">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b bg-card/40 backdrop-blur-md">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            Kanban Tugas
            {saving ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                <Loader2 className="h-3 w-3 animate-spin" /> Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
                <Save className="h-3 w-3" /> Sinkron ke Drive
              </span>
            )}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Kelola progres tugas dan lampirkan file terkait langsung dari Drive.</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8 flex gap-6 items-start pb-10">
          {columns.map((col, colIndex) => {
            const palette = COLUMN_PALETTE[colIndex % COLUMN_PALETTE.length];
            return (
            <div
              key={col.id}
              className="flex-shrink-0 w-[320px] bg-card/60 backdrop-blur-sm border shadow-sm rounded-xl flex flex-col min-h-[500px] overflow-hidden"
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, col.id)}
            >
              {/* Colored accent bar */}
              <div className={cn("h-1 w-full", palette.accent)} />

              {/* Column header */}
              <div className={cn("p-4 flex items-center justify-between border-b", palette.header)}>
                <h3 className={cn("font-bold text-[15px]", palette.title)}>
                  {col.title}
                  <span className={cn("ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full", palette.badge)}>
                    {col.tasks.length}
                  </span>
                </h3>
              </div>

              {/* Task list */}
              <div className="flex-1 p-3 space-y-3">
                {col.tasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id, col.id)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing transition-all border-muted hover:shadow-md",
                      palette.card
                    )}
                  >
                    <CardContent className="p-3 flex gap-2 justify-between items-start group">
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-[13px] whitespace-pre-wrap leading-relaxed text-foreground/90">
                          {task.content}
                        </p>

                        {/* Attached file chip */}
                        {task.file && (
                          <button
                            onClick={() => openFile(task.file!)}
                            className="flex items-center gap-1.5 max-w-full bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg px-2 py-1 transition-colors group/file"
                          >
                            <FileIcon mimeType={task.file.mimeType} className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-[11px] text-primary truncate max-w-[160px]">{task.file.fileName}</span>
                            <ExternalLink className="h-3 w-3 text-primary/50 flex-shrink-0" />
                          </button>
                        )}
                      </div>

                      {/* Task menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-1 -mt-1 bg-muted/50 hover:bg-muted"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {/* File actions */}
                          {task.file ? (
                            <>
                              <DropdownMenuItem onClick={() => openFile(task.file!)}>
                                <ExternalLink className="mr-2 h-4 w-4" /> Buka File
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => detachFile(col.id, task.id)}>
                                <X className="mr-2 h-4 w-4" /> Lepas File
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                // show inline picker on the card — use a state per task
                                const key = `${col.id}__${task.id}`;
                                setShowPicker(prev => prev === key ? null : key);
                              }}
                            >
                              <Paperclip className="mr-2 h-4 w-4" /> Lampirkan File
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {colIndex > 0 && (
                            <DropdownMenuItem onClick={() => moveTask(task.id, col.id, columns[colIndex - 1].id)}>
                              <ArrowLeft className="mr-2 h-4 w-4" /> Ke {columns[colIndex - 1].title}
                            </DropdownMenuItem>
                          )}
                          {colIndex < columns.length - 1 && (
                            <DropdownMenuItem onClick={() => moveTask(task.id, col.id, columns[colIndex + 1].id)}>
                              <ArrowRight className="mr-2 h-4 w-4" /> Ke {columns[colIndex + 1].title}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deleteTask(col.id, task.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>

                    {/* Inline file picker (shown per-task) */}
                    {showPicker === `${col.id}__${task.id}` && (
                      <div className="px-3 pb-3">
                        <FilePicker
                          onSelect={(f) => {
                            attachFileToTask(col.id, task.id, f);
                            setShowPicker(null);
                          }}
                          onCancel={() => setShowPicker(null)}
                        />
                      </div>
                    )}
                  </Card>
                ))}

                {/* Add task form */}
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
                            setPendingFile({ ...pendingFile, [col.id]: null });
                          }
                        }}
                      />

                      {/* File attachment for new task */}
                      {pendingFile[col.id] ? (
                        <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-2 py-1.5">
                          <FileIcon mimeType={pendingFile[col.id]!.mimeType} className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs truncate flex-1 text-primary">{pendingFile[col.id]!.fileName}</span>
                          <button onClick={() => setPendingFile({ ...pendingFile, [col.id]: null })}>
                            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      ) : showPicker === col.id ? (
                        <FilePicker
                          onSelect={(f) => {
                            setPendingFile({ ...pendingFile, [col.id]: f });
                            setShowPicker(null);
                          }}
                          onCancel={() => setShowPicker(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setShowPicker(col.id)}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Paperclip className="h-3.5 w-3.5" /> Lampirkan file dari Drive
                        </button>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" className="w-full text-xs h-8" onClick={() => addTask(col.id)}>Simpan</Button>
                        <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => {
                          const updated = { ...newTaskContent };
                          delete updated[col.id];
                          setNewTaskContent(updated);
                          setPendingFile({ ...pendingFile, [col.id]: null });
                        }}>Batal</Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start text-muted-foreground transition-colors border border-dashed border-transparent bg-muted/20",
                        palette.addBtn
                      )}
                      onClick={() => setNewTaskContent({ ...newTaskContent, [col.id]: "" })}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Tugas
                    </Button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
