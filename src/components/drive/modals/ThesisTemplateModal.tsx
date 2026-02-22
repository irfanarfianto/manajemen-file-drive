"use client";

import { useState } from "react";
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
import { Loader2, GraduationCap, Sparkles } from "lucide-react";

interface ThesisTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolder: string;
  onCreated: () => void;
}

export function ThesisTemplateModal({
  open,
  onOpenChange,
  currentFolder,
  onCreated,
}: ThesisTemplateModalProps) {
  const [title, setTitle] = useState(`Skripsi ${new Date().getFullYear()}`);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    const t = toast.loading("Membuat struktur skripsi...");
    
    try {
      const res = await fetch("/api/drive/template/skripsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), parentId: currentFolder }),
      });

      if (!res.ok) throw new Error("Gagal membuat template");

      toast.success("Struktur skripsi berhasil dibuat!", { id: t });
      onCreated();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">Template Skripsi</DialogTitle>
          <DialogDescription>
            Akan dibuat struktur folder otomatis (Bab 1-5, Referensi, dll) untuk membantu mengorganisir dokumen skripsi Anda.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-2 block">
            Nama Folder Utama
          </label>
          <Input
            placeholder="Contoh: Skripsi Arsitektur - Irfan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            disabled={loading}
            className="py-6 px-4 bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="rounded-xl">
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="rounded-xl px-6 shadow-lg shadow-primary/20"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Buat Sekarang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
