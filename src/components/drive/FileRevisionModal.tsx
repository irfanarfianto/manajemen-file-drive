"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Loader2, CheckCircle2, Circle, ClipboardList, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { DriveFile } from "@/lib/drive-types";
import { cn } from "@/lib/utils";

interface RevisionItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
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

  const revisions: RevisionItem[] = allData.files?.[file.id]?.revisions ?? [];
  const doneCount = revisions.filter(r => r.done).length;

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
    const text = newItemText.trim();
    if (!text) return;
    const newItem: RevisionItem = {
      id: Date.now().toString(),
      text,
      done: false,
      createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Daftar Revisi
          </DialogTitle>
          <DialogDescription className="truncate">
            {file.name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        {revisions.length > 0 && (
          <div className="mt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{doneCount} dari {revisions.length} revisi selesai</span>
              <span className={cn(
                "font-semibold",
                doneCount === revisions.length ? "text-green-500" : "text-primary"
              )}>
                {Math.round((doneCount / revisions.length) * 100)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  doneCount === revisions.length ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${(doneCount / revisions.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Revision list */}
        <ScrollArea className="flex-1 -mx-1 px-1 mt-3">
          {loading ? (
            <div className="flex items-center justify-center p-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Belum ada catatan revisi</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Tambahkan poin revisi dari dosen di bawah</p>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {/* Show undone first, done at bottom */}
              {[...revisions.filter(r => !r.done), ...revisions.filter(r => r.done)].map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all group",
                    item.done
                      ? "bg-muted/30 border-muted opacity-60"
                      : "bg-card border-border hover:border-primary/30 hover:bg-primary/5"
                  )}
                >
                  <button
                    onClick={() => handleToggle(item.id)}
                    disabled={saving}
                    className="mt-0.5 flex-shrink-0 transition-colors"
                    aria-label="Toggle selesai"
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-snug break-words",
                      item.done && "line-through text-muted-foreground"
                    )}>
                      {item.text}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">Ditambahkan {item.createdAt}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={saving}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive mt-0.5"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Add new item */}
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="Tulis poin revisi dari dosen..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            disabled={saving || loading}
            className="flex-1"
          />
          <Button
            onClick={handleAdd}
            disabled={!newItemText.trim() || saving || loading}
            size="icon"
            className="flex-shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter className="mt-3 flex-col sm:flex-row gap-2">
          {file.webViewLink && (
            <Button
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={() => window.open(file.webViewLink, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              Buka Dokumen
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
