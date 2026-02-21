"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Loader2, CheckCircle2, Circle, ClipboardList, ExternalLink, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DriveFile } from "@/lib/drive-types";
import { cn } from "@/lib/utils";

interface RevisionItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  page?: number;
}

interface FileNotesData {
  files: Record<string, {
    fileName: string;
    revisions: RevisionItem[];
  }>;
}

interface FileRevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile;
}

export function FileRevisionModal({ open, onOpenChange, file }: FileRevisionModalProps) {
  const [allData, setAllData] = useState<FileNotesData>({ files: {} });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  // Parse "12, teks revisi" → { page: 12, text: "teks revisi" }
  const parseInput = (raw: string): { page?: number; text: string } => {
    const match = raw.match(/^(\d+),\s*(.+)/);
    if (match) return { page: parseInt(match[1], 10), text: match[2].trim() };
    return { text: raw.trim() };
  };

  const revisions: RevisionItem[] = allData.files?.[file.id]?.revisions ?? [];
  const doneCount = revisions.filter(r => r.done).length;
  const progress = revisions.length > 0 ? Math.round((doneCount / revisions.length) * 100) : 0;
  const allDone = revisions.length > 0 && doneCount === revisions.length;

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive/file-notes");
      if (!res.ok) throw new Error("Gagal memuat catatan revisi");
      const data: FileNotesData = await res.json();
      setAllData(data);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotes();
      setNewItemText("");
    }
  }, [open, fetchNotes]);

  const saveData = async (updated: FileNotesData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/drive/file-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setAllData(updated);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getUpdatedData = (newRevisions: RevisionItem[]): FileNotesData => ({
    ...allData,
    files: {
      ...allData.files,
      [file.id]: { fileName: file.name, revisions: newRevisions },
    },
  });

  const handleAdd = async () => {
    const raw = newItemText.trim();
    if (!raw) return;
    const { page, text } = parseInput(raw);
    const newItem: RevisionItem = {
      id: Date.now().toString(),
      text,
      done: false,
      createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      ...(page ? { page } : {}),
    };
    setNewItemText("");
    await saveData(getUpdatedData([...revisions, newItem]));
  };

  const handleToggle = async (id: string) => {
    const updated = revisions.map(r => r.id === id ? { ...r, done: !r.done } : r);
    await saveData(getUpdatedData(updated));
  };

  const handleDelete = async (id: string) => {
    const updated = revisions.filter(r => r.id !== id);
    await saveData(getUpdatedData(updated));
  };

  const sortedRevisions = [
    ...revisions.filter(r => !r.done),
    ...revisions.filter(r => r.done),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b bg-card/50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0 mt-0.5">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base leading-tight">Daftar Revisi</SheetTitle>
                <SheetDescription className="truncate text-xs mt-1">
                  {file.name}
                </SheetDescription>
              </div>
            </div>
            {file.webViewLink && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 flex-shrink-0 text-xs"
                onClick={() => window.open(file.webViewLink, "_blank", "noopener,noreferrer")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka
              </Button>
            )}
          </div>

          {/* Progress */}
          {revisions.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {doneCount} dari {revisions.length} revisi selesai
                </span>
                <span className={cn(
                  "font-bold tabular-nums",
                  allDone ? "text-green-500" : "text-primary"
                )}>
                  {progress}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    allDone ? "bg-green-500" : "bg-primary"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {allDone && (
                <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Semua revisi sudah diselesaikan! 🎉
                </p>
              )}
            </div>
          )}
        </SheetHeader>

        {/* Revision List */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                <p className="text-sm text-muted-foreground">Memuat dari Drive...</p>
              </div>
            ) : revisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belum ada revisi</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Tambahkan poin revisi dari dosen di bawah
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedRevisions.map((item, idx) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group flex items-start gap-3 p-3.5 rounded-xl border transition-all",
                      item.done
                        ? "bg-muted/20 border-muted/50 opacity-55"
                        : "bg-card hover:border-primary/30 hover:bg-primary/5 border-border shadow-sm"
                    )}
                  >
                    {/* Number + Checkbox */}
                    <div className="flex items-center gap-2 mt-0.5 flex-shrink-0">
                      {!item.done && (
                        <span className="text-[10px] font-bold text-muted-foreground/50 w-4 text-center">
                          {revisions.filter(r => !r.done).indexOf(item) + 1}
                        </span>
                      )}
                      <button
                        onClick={() => handleToggle(item.id)}
                        disabled={saving}
                        className="transition-colors"
                        aria-label="Toggle selesai"
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 flex-wrap">
                        {item.page && (
                          <span className="inline-flex items-center gap-0.5 shrink-0 bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-bold leading-none mt-0.5">
                            Hal.&nbsp;{item.page}
                          </span>
                        )}
                        <p className={cn(
                          "text-sm leading-snug break-words",
                          item.done && "line-through text-muted-foreground"
                        )}>
                          {item.text}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground/50 mt-1">
                        {item.done ? "✓ Selesai · " : ""}{item.createdAt}
                      </p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={saving}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive mt-0.5 flex-shrink-0"
                      aria-label="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Add new item - sticky bottom */}
        <div className="px-4 py-4 border-t bg-card/50 space-y-3">
          {saving && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Save className="h-3 w-3 animate-pulse" />
              Menyimpan ke Drive...
            </div>
          )}
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="12, tulis poin revisi... (atau langsung tulis)"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                disabled={saving || loading}
                className="flex-1 text-sm"
              />
              <Button
                onClick={handleAdd}
                disabled={!newItemText.trim() || saving || loading}
                size="icon"
                className="flex-shrink-0"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground/50">Awali dengan nomor halaman, contoh: <span className="font-mono">24, perbaiki sub judul</span></p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
