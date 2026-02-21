"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft, Download, ExternalLink, Loader2,
  CheckCircle2, Circle, ClipboardList, Plus, Trash2, Save,
  FileText, Tag, X as CloseIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/drive-types";

// ─── Revision types ────────────────────────────────────────────────────────
interface RevisionItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}
interface FileNotesData {
  files: Record<string, { fileName: string; revisions: RevisionItem[] }>;
}

// ─── Revision panel (right side) ──────────────────────────────────────────
function RevisionPanel({ fileId, fileName }: { fileId: string; fileName: string }) {
  const [allData, setAllData] = useState<FileNotesData>({ files: {} });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newText, setNewText] = useState("");

  const revisions: RevisionItem[] = allData.files?.[fileId]?.revisions ?? [];
  const doneCount = revisions.filter(r => r.done).length;
  const progress = revisions.length > 0 ? Math.round((doneCount / revisions.length) * 100) : 0;
  const allDone = revisions.length > 0 && doneCount === revisions.length;

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/file-notes");
      if (!res.ok) throw new Error("Gagal memuat catatan revisi");
      setAllData(await res.json());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const save = async (updated: FileNotesData) => {
    setSaving(true);
    try {
      await fetch("/api/drive/file-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setAllData(updated);
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  };

  const withUpdated = (newRevisions: RevisionItem[]): FileNotesData => ({
    ...allData,
    files: { ...allData.files, [fileId]: { fileName, revisions: newRevisions } },
  });

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text) return;
    setNewText("");
    await save(withUpdated([...revisions, {
      id: Date.now().toString(), text, done: false,
      createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    }]));
  };

  const handleToggle = (id: string) =>
    save(withUpdated(revisions.map(r => r.id === id ? { ...r, done: !r.done } : r)));

  const handleDelete = (id: string) =>
    save(withUpdated(revisions.filter(r => r.id !== id)));

  const sorted = [...revisions.filter(r => !r.done), ...revisions.filter(r => r.done)];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b bg-card/60 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="h-4 w-4 text-primary flex-shrink-0" />
          <h3 className="font-bold text-sm">Daftar Revisi Dosen</h3>
          {saving && <Save className="h-3.5 w-3.5 text-muted-foreground animate-pulse ml-auto" />}
        </div>
        <p className="text-[11px] text-muted-foreground truncate">{fileName}</p>

        {/* Progress */}
        {revisions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground">{doneCount}/{revisions.length} selesai</span>
              <span className={cn("font-bold", allDone ? "text-green-500" : "text-primary")}>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", allDone ? "bg-green-500" : "bg-primary")}
                style={{ width: `${progress}%` }}
              />
            </div>
            {allDone && (
              <p className="text-[11px] text-green-500 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Semua revisi selesai! 🎉
              </p>
            )}
          </div>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground">Belum ada revisi.<br />Tambahkan di bawah.</p>
            </div>
          ) : (
            sorted.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group flex items-start gap-2.5 p-3 rounded-xl border transition-all",
                  item.done
                    ? "bg-muted/20 border-muted/40 opacity-50"
                    : "bg-card hover:border-primary/30 hover:bg-primary/5 border-border shadow-sm"
                )}
              >
                <button onClick={() => handleToggle(item.id)} disabled={saving} className="mt-0.5 flex-shrink-0">
                  {item.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                    : <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[13px] leading-snug break-words", item.done && "line-through text-muted-foreground")}>
                    {item.text}
                  </p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">{item.createdAt}</p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={saving}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive mt-0.5 flex-shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Add input */}
      <div className="p-4 border-t bg-card/50 flex-shrink-0 flex gap-2">
        <Input
          placeholder="Tulis poin revisi..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          disabled={saving || loading}
          className="text-sm flex-1"
        />
        <Button size="icon" onClick={handleAdd} disabled={!newText.trim() || saving || loading} className="flex-shrink-0">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

// ─── Tag editor (inline in header) ────────────────────────────────────────
function TagEditor({ fileId, initialTags }: { fileId: string; initialTags: string[] }) {
  const [tags, setTags] = useState(initialTags);
  const [newTag, setNewTag] = useState("");
  const [busy, setBusy] = useState(false);

  const saveTags = async (next: string[]) => {
    setBusy(true);
    try {
      const res = await fetch("/api/drive/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, tags: next }),
      });
      if (!res.ok) throw new Error("Gagal");
      setTags(next);
    } catch { toast.error("Gagal menyimpan tag"); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tags.map(t => (
        <Badge key={t} variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] bg-primary/10 text-primary border-primary/20">
          {t}
          <button onClick={() => saveTags(tags.filter(x => x !== t))} disabled={busy} className="hover:text-destructive">
            <CloseIcon className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <div className="flex items-center bg-muted rounded-md px-2 py-0.5 h-6 gap-1">
        <Tag className="h-3 w-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Tag..."
          className="bg-transparent text-[11px] w-16 outline-none border-none focus:ring-0 placeholder:text-muted-foreground/60"
          value={newTag}
          onChange={e => setNewTag(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && newTag.trim()) {
              saveTags([...tags, newTag.trim()]);
              setNewTag("");
            }
          }}
          disabled={busy}
        />
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
function PreviewPageInner() {
  const params = useSearchParams();
  const router = useRouter();

  const fileId = params.get("fileId") ?? "";
  const fileName = params.get("fileName") ?? "File";
  const mimeType = params.get("mimeType") ?? "";
  const webViewLink = params.get("webViewLink") ?? "";
  const fileSize = params.get("fileSize") ?? "0";
  const tagsRaw = params.get("tags") ?? "";
  const initialTags = tagsRaw ? tagsRaw.split(",").filter(Boolean) : [];

  const isImage = mimeType.startsWith("image/");
  const isPdf = mimeType === "application/pdf";
  const isGoogleDoc = mimeType.includes("google-apps");
  const isOfficeDoc = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
  ].includes(mimeType);
  const canPreviewInFrame = isPdf || isGoogleDoc || isOfficeDoc || mimeType.startsWith("text/") || mimeType.startsWith("video/") || mimeType.startsWith("audio/");
  const previewUrl = `/api/drive/preview?fileId=${fileId}`;

  const handleDownload = async () => {
    const t = toast.loading("Menyiapkan download...");
    try {
      const res = await fetch(`/api/drive/download?fileId=${fileId}`);
      if (!res.ok) throw new Error("Download gagal");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click();
      window.URL.revokeObjectURL(url); document.body.removeChild(a);
      toast.success("Download dimulai", { id: t });
    } catch (err) { toast.error((err as Error).message, { id: t }); }
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 flex-shrink-0 z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate leading-none">{fileName}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{formatFileSize(parseInt(fileSize))}</p>
          </div>
          <div className="hidden md:flex">
            <TagEditor fileId={fileId} initialTags={initialTags} />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          {webViewLink && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => window.open(webViewLink, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Drive
            </Button>
          )}
        </div>
      </header>

      {/* Body: preview (left) + revision panel (right) */}
      <div className="flex flex-1 min-h-0">
        {/* Left: file preview */}
        <div className="flex-1 bg-muted/20 overflow-auto flex items-center justify-center p-4">
          {isImage ? (
            <Image
              src={`/api/drive/preview?fileId=${fileId}`}
              alt={fileName}
              width={1200}
              height={1200}
              unoptimized
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          ) : canPreviewInFrame ? (
            <iframe
              src={previewUrl}
              className="w-full h-full rounded-xl border bg-white shadow-inner"
              title={fileName}
            />
          ) : (
            <div className="flex flex-col items-center text-center max-w-sm gap-4 p-10 rounded-2xl bg-card border shadow-sm">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pratinjau tidak tersedia</h3>
                <p className="text-sm text-muted-foreground">Tipe file ini tidak dapat ditampilkan. Silakan download atau buka di Drive.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download</Button>
                {webViewLink && <Button size="sm" onClick={() => window.open(webViewLink, "_blank")}><ExternalLink className="mr-2 h-4 w-4" />Buka</Button>}
              </div>
            </div>
          )}
        </div>

        {/* Right: revision panel */}
        <div className="w-80 border-l bg-card flex-shrink-0 flex flex-col">
          <RevisionPanel fileId={fileId} fileName={fileName} />
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    }>
      <PreviewPageInner />
    </Suspense>
  );
}
