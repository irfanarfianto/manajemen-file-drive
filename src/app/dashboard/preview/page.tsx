"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Download, ExternalLink, Loader2,
  CheckCircle2, Circle, ClipboardList, Plus, Trash2, Save,
  FileText, Menu,
  ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveQuota } from "@/hooks/useDrive";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/drive-types";

// ─── Revision types ────────────────────────────────────────────────────────
interface RevisionItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  page?: number;
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

  // Parse "12, teks revisi" → { page: 12, text: "teks revisi" }
  const parseInput = (raw: string): { page?: number; text: string } => {
    const match = raw.match(/^(\d+),\s*(.+)/);
    if (match) return { page: parseInt(match[1], 10), text: match[2].trim() };
    return { text: raw.trim() };
  };

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
      // Handle cases where the browser restores the page from cache without re-mounting
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
    const raw = newText.trim();
    if (!raw) return;
    const { page, text } = parseInput(raw);
    setNewText("");
    await save(withUpdated([...revisions, {
      id: Date.now().toString(), text, done: false,
      createdAt: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      ...(page ? { page } : {}),
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
          <h3 className="font-bold text-sm">Daftar Revisi</h3>
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
                  <div className="flex items-start gap-1.5 flex-wrap">
                    {item.page && (
                      <span className="inline-flex items-center shrink-0 bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[10px] font-bold leading-none mt-0.5">
                        Hal.&nbsp;{item.page}
                      </span>
                    )}
                    <p className={cn("text-[13px] leading-snug break-words", item.done && "line-through text-muted-foreground")}>
                      {item.text}
                    </p>
                  </div>
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
      <div className="p-4 border-t bg-card/50 flex-shrink-0 space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="12, tulis poin revisi... (atau langsung tulis)"
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
        <p className="text-[10px] text-muted-foreground/50">Awali dengan nomor halaman, contoh: <span className="font-mono">24, perbaiki sub judul</span></p>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
function PreviewPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { quota } = useDriveQuota();

  const fileId = params.get("fileId") ?? "";
  const fileName = params.get("fileName") ?? "File";
  const mimeType = params.get("mimeType") ?? "";
  const webViewLink = params.get("webViewLink") ?? "";
  const fileSize = params.get("fileSize") ?? "0";
  const modifiedTime = params.get("modifiedTime") ?? "";

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const [previewLoading, setPreviewLoading] = useState(true);
  const [zoom, setZoom] = useState(0.35);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset loading, zoom, and position when file changes
  useEffect(() => {
    setPreviewLoading(true);
    setZoom(0.35);
    setPosition({ x: 0, y: 0 });
  }, [fileId]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleZoomReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 0.35) return; // Only drag if zoomed in enough (optional)
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const onMouseUp = () => setIsDragging(false);

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
    <div className="flex h-full flex-col bg-background overflow-hidden">
      {/* Top bar */}
      <header className="h-16 border-b bg-card/80 backdrop-blur-md flex items-center gap-3 px-4 flex-shrink-0 z-50">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-r">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasi</SheetTitle>
                <SheetDescription>Menu utama dashboard</SheetDescription>
              </SheetHeader>
              <Sidebar
                currentFolder={""}
                onFolderChange={(id) => router.push(`/dashboard?folderId=${id}`)}
                quota={quota ?? null}
                onNewFolder={() => router.push("/dashboard?action=newFolder")}
                onUpload={() => router.push("/dashboard?action=upload")}
                onThesisTemplate={() => router.push("/dashboard?action=thesisTemplate")}
                currentFolderName="Drive"
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate leading-none mb-1">{fileName}</p>
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
            <span>{formatFileSize(parseInt(fileSize))}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Diperbarui {formatFullDate(modifiedTime)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5" /> Download
          </Button>
          
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                  <ClipboardList className="h-3.5 w-3.5" /> Revisi
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 w-full sm:max-w-md border-l">
                <SheetHeader className="sr-only">
                  <SheetTitle>Daftar Revisi</SheetTitle>
                  <SheetDescription>Kelola catatan revisi untuk file ini</SheetDescription>
                </SheetHeader>
                <RevisionPanel fileId={fileId} fileName={fileName} />
              </SheetContent>
            </Sheet>
          </div>

          {webViewLink && (
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden sm:flex" onClick={() => window.open(webViewLink, "_blank")}>
              <ExternalLink className="h-3.5 w-3.5" /> Drive
            </Button>
          )}
        </div>
      </header>

      {/* Body: preview (left) + revision panel (right) */}
      <div className="flex flex-1 min-h-0">
        {/* Left: file preview */}
        <div className="flex-1 bg-muted/20 relative flex flex-col">
          {previewLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">
              <div className="flex flex-col items-center gap-5">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-2 border-4 border-primary/20 border-b-transparent rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
                  <div className="absolute inset-4 border-4 border-primary/40 border-l-transparent rounded-full animate-[spin_2s_linear_infinite]"></div>
                </div>
                
                <div className="flex flex-col items-center gap-1 text-center px-4">
                  <p className="text-xs font-bold text-foreground/80 tracking-tight">Memuat Pratinjau...</p>
                  <p className="text-[10px] text-muted-foreground animate-pulse font-medium">Ini mungkin butuh beberapa detik untuk file besar</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 h-full w-full overflow-auto flex items-center justify-center p-2 sm:p-8 relative bg-black/5 scrollbar-thin">
            {isImage ? (
              <div 
                className={cn(
                  "flex items-center justify-center min-h-full min-w-full p-4 touch-none transition-transform duration-75",
                  zoom > 0.35 ? "cursor-grab" : "cursor-default",
                  isDragging && "cursor-grabbing active:scale-[0.99]"
                )}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              >
                <div 
                   style={{ 
                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out, opacity 0.5s ease-in-out'
                  }}
                  className="relative"
                >
                  <Image
                    src={`/api/drive/preview?fileId=${fileId}`}
                    alt={fileName}
                    width={1400}
                    height={1400}
                    unoptimized
                    draggable={false}
                    className={cn(
                      "max-w-full h-auto object-contain rounded-lg shadow-2xl m-auto shadow-black/20 select-none",
                      previewLoading ? "opacity-0" : "opacity-100"
                    )}
                    onLoad={() => setPreviewLoading(false)}
                  />
                </div>

                {/* Floating Zoom Slider */}
                {!previewLoading && (
                  <div 
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:right-[340px] lg:translate-x-0 flex items-center gap-4 p-3 rounded-2xl bg-card/80 backdrop-blur-md border shadow-2xl z-50 animate-in slide-in-from-bottom-4 w-[280px]"
                    onMouseDown={(e) => e.stopPropagation()} // Prevent drag start when clicking controls
                  >
                    <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={zoom <= 0.1} className="h-8 w-8 rounded-lg hover:bg-primary/10 shrink-0">
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1 flex flex-col gap-1.5 pt-1">
                      <Slider
                        value={[zoom]}
                        min={0.1}
                        max={3}
                        step={0.01}
                        onValueChange={(val) => setZoom(val[0])}
                      />
                    </div>

                    <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={zoom >= 3} className="h-8 w-8 rounded-lg hover:bg-primary/10 shrink-0">
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    
                    <div className="w-px h-6 bg-border mx-0.5" />
                    
                    <Button variant="ghost" size="icon" onClick={handleZoomReset} className="h-8 w-8 rounded-lg hover:bg-primary/10 shrink-0" title="Reset to 100%">
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : canPreviewInFrame ? (
              <iframe
                src={previewUrl}
                className={cn(
                  "w-full h-full rounded-xl border bg-white shadow-inner transition-opacity duration-500",
                  previewLoading ? "opacity-0" : "opacity-100"
                )}
                title={fileName}
                onLoad={() => setPreviewLoading(false)}
              />
            ) : (
              <div className="flex flex-col items-center text-center max-w-sm gap-4 p-10 rounded-2xl bg-card border shadow-sm my-auto">
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
        </div>

        {/* Right: revision panel (visible on large screens only) */}
        <div className="hidden lg:flex w-80 border-l bg-card flex-shrink-0 flex flex-col">
          <RevisionPanel fileId={fileId} fileName={fileName} />
        </div>
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    }>
      <PreviewPageInner />
    </Suspense>
  );
}
