"use client";

import { useState, useEffect } from "react";
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
  FileText,
  Upload,
  Plus,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  X as CloseIcon
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { DriveFile } from "@/lib/drive-types";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string;
  currentFolderName: string;
  onUploadSuccess: () => void;
}

export function UploadModal({
  open,
  onOpenChange,
  currentFolderId,
  currentFolderName,
  onUploadSuccess,
}: UploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [targetId, setTargetId] = useState(currentFolderId === "dashboard" || currentFolderId === "root" ? "root" : currentFolderId);
  const [targetName, setTargetName] = useState(currentFolderName);
  const [isPickingFolder, setIsPickingFolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);

  useEffect(() => {
    if (open) {
      setTargetId(currentFolderId === "dashboard" || currentFolderId === "root" ? "root" : currentFolderId);
      setTargetName(currentFolderName);
    }
  }, [open, currentFolderId, currentFolderName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const formData = new FormData();
    files.forEach(f => formData.append("files", f));
    formData.append("parentId", targetId);

    try {
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal upload");
      }

      toast.success(`${files.length} file berhasil diupload ke "${targetName}"`);
      onUploadSuccess();
      onOpenChange(false);
      setFiles([]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
        <div className="max-h-[90vh] flex flex-col relative">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload ke Drive
            </DialogTitle>
            <DialogDescription>
              Pilih file dan tentukan folder tujuan upload Anda.
            </DialogDescription>
          </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pilih File</label>
            <div 
              className="border-2 border-dashed rounded-2xl p-8 hover:bg-muted/50 transition-colors cursor-pointer text-center relative group"
              onClick={() => document.getElementById("hidden-file-input")?.click()}
            >
              <input 
                id="hidden-file-input"
                type="file" 
                multiple 
                className="hidden" 
                onChange={handleFileChange} 
              />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold text-sm">Klik untuk memilih file</p>
                <p className="text-xs text-muted-foreground mt-1">Mendukung banyak file sekaligus</p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border text-xs group">
                    <div className="w-8 h-8 rounded bg-background flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 truncate font-medium">{file.name}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="p-1 hover:text-destructive transition-opacity"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lokasi Tujuan</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 transition-all hover:bg-primary/10 cursor-pointer"
                   onClick={() => setIsPickingFolder(true)}>
                <FolderOpen className="h-5 w-5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary/60 font-medium">Upload ke</p>
                  <p className="font-bold truncate text-sm">{targetName}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-8 rounded-lg"
                >
                  Ganti
                </Button>
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-12 w-12 rounded-xl"
                onClick={() => setShowNewFolder(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/30 border-t flex-row justify-between items-center sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Batal</Button>
          <Button 
            onClick={handleUpload} 
            disabled={files.length === 0 || loading}
            className="px-8"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Upload
          </Button>
        </DialogFooter>

        {isPickingFolder && (
          <div className="absolute inset-0 bg-background z-50 flex flex-col p-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 mb-6">
              <Button variant="ghost" size="icon" onClick={() => setIsPickingFolder(false)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-bold text-lg">Pilih Folder</h3>
            </div>
            <FolderPicker 
              onSelect={(id, name) => {
                setTargetId(id);
                setTargetName(name);
                setIsPickingFolder(false);
              }}
            />
          </div>
        )}

        {showNewFolder && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in zoom-in duration-200">
            <div className="bg-card border shadow-2xl rounded-3xl p-6 w-full max-w-sm">
              <h3 className="font-bold text-lg mb-4 truncate pr-4">Buat Folder di {targetName}</h3>
              <NewFolderContent 
                parentId={targetId} 
                onCreated={() => setShowNewFolder(false)}
                onCancel={() => setShowNewFolder(false)}
              />
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewFolderContent({ parentId, onCreated, onCancel }: { parentId: string, onCreated: () => void, onCancel: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await fetch("/api/drive/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId }),
      });
      toast.success("Folder berhasil dibuat");
      onCreated();
    } catch {
      toast.error("Gagal membuat folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input 
        placeholder="Nama folder..." 
        value={name} 
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={loading}>Batal</Button>
        <Button onClick={handleCreate} disabled={!name.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Buat
        </Button>
      </div>
    </div>
  );
}

function FolderPicker({ onSelect }: { onSelect: (id: string, name: string) => void }) {
  const [currentId, setCurrentId] = useState("root");
  const [history, setHistory] = useState<Array<{ id: string, name: string }>>([{ id: "root", name: "My Drive" }]);
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);

  const currentFolder = history[history.length - 1];

  useEffect(() => {
    const fetchFolders = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/drive/files?folderId=${currentId}`);
        const data = await res.json();
        setFolders(data.files.filter((f: DriveFile) => f.mimeType === "application/vnd.google-apps.folder"));
      } catch {
        toast.error("Gagal mengambil daftar folder");
      } finally {
        setLoading(false);
      }
    };
    fetchFolders();
  }, [currentId]);

  const navigateTo = (id: string, name: string) => {
    setCurrentId(id);
    setHistory(prev => [...prev, { id, name }]);
  };

  const goBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setCurrentId(newHistory[newHistory.length - 1].id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {history.map((h, i) => (
            <div key={h.id} className="flex items-center flex-shrink-0">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground mx-1" />}
              <span className={cn(
                "text-xs font-medium cursor-pointer hover:text-primary transition-colors",
                i === history.length - 1 ? "text-primary font-bold" : "text-muted-foreground"
              )} onClick={() => {
                const newHistory = history.slice(0, i + 1);
                setHistory(newHistory);
                setCurrentId(h.id);
              }}>
                {h.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 border rounded-2xl bg-muted/20">
        <div className="p-2 space-y-1">
          {history.length > 1 && (
            <div 
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-background cursor-pointer transition-colors"
              onClick={goBack}
            >
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <ChevronLeft className="h-5 w-5" />
              </div>
              <span className="font-medium text-sm">Kembali</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
              <span className="text-xs text-muted-foreground">Mencari folder...</span>
            </div>
          ) : folders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <FolderOpen className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium">Tidak ada folder</p>
            </div>
          ) : (
            folders.map(folder => (
              <div 
                key={folder.id} 
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-background group cursor-pointer transition-colors"
                onClick={() => navigateTo(folder.id, folder.name)}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{folder.name}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="mt-6">
        <Button 
          className="w-full h-12 rounded-2xl shadow-lg"
          onClick={() => onSelect(currentFolder.id, currentFolder.name)}
        >
          Pilih &ldquo;{currentFolder.name}&rdquo;
        </Button>
      </div>
    </div>
  );
}
