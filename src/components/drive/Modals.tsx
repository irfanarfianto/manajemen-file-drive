"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Loader2, 
  ExternalLink, 
  Eye, 
  Download, 
  FileText, 
  Tag,
  Plus,
  X as CloseIcon,
  Sparkles
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DriveFile } from "@/lib/drive-types";
import { formatFileSize } from "@/lib/drive-types";

interface BaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewFolderModal({
  open,
  onOpenChange,
  currentFolder,
  onCreated,
}: BaseModalProps & { currentFolder: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/drive/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId: currentFolder }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal membuat folder");
      }
      toast.success("Folder berhasil dibuat");
      onCreated();
      onOpenChange(false);
      setName("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Folder Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama untuk folder baru kamu.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Nama folder..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            id="new-folder-name-input"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            id="create-folder-submit"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Buat Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RenameModal({
  open,
  onOpenChange,
  file,
  onRenamed,
}: BaseModalProps & { file: DriveFile; onRenamed: () => void }) {
  const [name, setName] = useState(file.name);
  const [loading, setLoading] = useState(false);

  const handleRename = async () => {
    if (!name.trim() || name === file.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/drive/file", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, name: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal rename");
      }
      toast.success("Berhasil mengubah nama");
      onRenamed();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ganti Nama</DialogTitle>
          <DialogDescription>
            Masukkan nama baru untuk file atau folder ini.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            id="rename-input"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={handleRename}
            disabled={!name.trim() || name === file.name || loading}
            id="rename-submit"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteModal({
  open,
  onOpenChange,
  file,
  onDeleted,
}: BaseModalProps & { file: DriveFile; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive/file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      if (!res.ok) throw new Error("Gagal menghapus file");
      toast.success("Berhasil memindahkan ke Trash");
      onDeleted();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hapus ke Trash</DialogTitle>
          <DialogDescription>
            Yakin ingin memindahkan <span className="font-bold text-foreground">&ldquo;{file.name}&rdquo;</span> ke Trash? Kamu masih bisa memulihkannya nanti di Google Drive.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            id="delete-confirm"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export function PreviewModal({
  open,
  onOpenChange,
  file,
  onDownload,
  onTagsUpdated,
}: BaseModalProps & { 
  file: DriveFile; 
  onDownload: (file: DriveFile) => void;
  onTagsUpdated?: () => void;
}) {
  const [newTag, setNewTag] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const tags = Object.keys(file.properties || {})
    .filter(k => k.startsWith("tag_"))
    .map(k => k.replace("tag_", ""));

  const canSummarize = file.mimeType === "application/pdf" || 
                       file.mimeType.includes("google-apps.document") ||
                       file.mimeType.startsWith("text/");

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, mimeType: file.mimeType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal meringkas");
      }
      const data = await res.json();
      setSummary(data.summary);
      toast.success("Ringkasan berhasil dibuat!");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsSummarizing(false);
    }
  };


  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    setIsUpdatingTags(true);
    try {
      const res = await fetch("/api/drive/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, tags: [...tags, newTag.trim()] }),
      });
      if (!res.ok) throw new Error("Gagal menambah tag");
      setNewTag("");
      onTagsUpdated?.();
      toast.success("Tag ditambahkan");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setIsUpdatingTags(true);
    try {
      // In a real app, we'd sent the specific tag to delete.
      // For now, our simple API just SETS the tags. 
      // To DELETE a property in GDrive, we usually set it to null.
      // Let's modify the API or just send the new array.
      const newTags = tags.filter(t => t !== tagToRemove);
      const res = await fetch("/api/drive/tags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, tags: newTags }),
      });
      if (!res.ok) throw new Error("Gagal menghapus tag");
      onTagsUpdated?.();
      toast.success("Tag dihapus");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setIsUpdatingTags(false);
    }
  };

  const isImage = file.mimeType.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const canPreviewInFrame = isPdf || file.mimeType.includes("google-apps");


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col border-none">
        <DialogHeader className="p-4 border-b bg-card flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base truncate pr-4">{file.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {formatFileSize(parseInt(file.size || "0"))} • Terakhir diubah {new Date(file.modifiedTime || "").toLocaleDateString("id-ID")}
              </DialogDescription>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-8">
            <div className="flex flex-wrap gap-1 mr-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] bg-primary/5 text-primary border-primary/10 group">
                  {tag}
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    disabled={isUpdatingTags}
                    className="hover:text-destructive transition-colors"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex items-center bg-muted rounded-lg px-2 py-1">
              <Tag className="h-3 w-3 text-muted-foreground mr-2" />
              <input 
                type="text"
                placeholder="Tambah tag..."
                className="bg-transparent border-none text-[10px] focus:ring-0 w-24 outline-none"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                disabled={isUpdatingTags}
              />
              <button 
                onClick={handleAddTag}
                disabled={!newTag.trim() || isUpdatingTags}
                className="text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        </DialogHeader>


        <div className="flex-1 bg-muted/30 flex flex-col md:flex-row min-h-[400px] overflow-hidden">
          <div className={cn(
            "flex-1 flex items-center justify-center p-4 overflow-auto",
            summary ? "md:border-r" : ""
          )}>
            {isImage ? (
              <Image
                src={file.thumbnailLink?.replace("=s220", "=s1000") || file.webViewLink || ""}
                alt={file.name}
                width={1000}
                height={1000}
                unoptimized
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
            ) : canPreviewInFrame ? (
              <iframe
                src={file.webViewLink?.replace("/view", "/preview")}
                className="w-full h-[60vh] rounded-lg border bg-white"
                title={file.name}
              />
            ) : (
              <div className="text-center p-12 bg-card rounded-2xl border shadow-sm max-w-sm">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Pratinjau tidak tersedia</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Tipe file ini tidak dapat dipratinjau langsung. Silakan buka di Google Drive atau download untuk melihatnya.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                  {file.webViewLink && (
                    <Button size="sm" onClick={() => window.open(file.webViewLink, "_blank")}>
                      <ExternalLink className="mr-2 h-4 w-4" /> Buka di Drive
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Summary Panel */}
          {(summary || isSummarizing) && (
            <div className="w-full md:w-80 bg-card p-4 flex flex-col border-t md:border-t-0">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-bold text-sm">Ringkasan AI</h4>
              </div>
              
              <ScrollArea className="flex-1 pr-4">
                {isSummarizing ? (
                  <div className="space-y-3 py-4">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
                    <div className="h-4 bg-muted animate-pulse rounded w-4/6" />
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <p className="text-[10px] text-center text-muted-foreground animate-pulse mt-4">
                      Sedang membaca isi file...
                    </p>
                  </div>
                ) : (
                  <div className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {summary}
                  </div>
                )}
              </ScrollArea>
              
              {!isSummarizing && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-[10px] text-muted-foreground italic">
                    Dihasilkan oleh Gemini AI. Selalu verifikasi informasi penting.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>


        <DialogFooter className="p-4 bg-card border-t flex-row justify-between items-center sm:justify-between">
          <div className="flex gap-2">
            {canSummarize && !summary && (
              <Button 
                onClick={handleSummarize} 
                disabled={isSummarizing}
                variant="secondary"
                className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
                size="sm"
              >
                {isSummarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Ringkas dengan AI</span>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onDownload(file)}>
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>

            {file.webViewLink && (
              <Button variant="outline" size="sm" onClick={() => window.open(file.webViewLink, "_blank")}>
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Buka di Drive</span>
              </Button>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)} size="sm">Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
