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
import type { DriveFile } from "@/lib/drive-types";

interface RenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile;
  onRenamed: () => void;
}

export function RenameModal({
  open,
  onOpenChange,
  file,
  onRenamed,
}: RenameModalProps) {
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
