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
import { Loader2 } from "lucide-react";

interface NewFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolder: string;
  onCreated: () => void;
}

export function NewFolderModal({
  open,
  onOpenChange,
  currentFolder,
  onCreated,
}: NewFolderModalProps) {
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
