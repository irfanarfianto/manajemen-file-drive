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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { DriveFile } from "@/lib/drive-types";

interface DeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: DriveFile[];
  onDeleted: () => void;
}

export function DeleteModal({
  open,
  onOpenChange,
  files,
  onDeleted,
}: DeleteModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: files.map(f => f.id) }),
      });
      if (!res.ok) throw new Error("Gagal menghapus file");
      toast.success(`Berhasil menghapus ${files.length} item ke Trash`);
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
            Yakin ingin memindahkan {files.length > 1 ? <span className="font-bold">{files.length} item</span> : <span className="font-bold text-foreground">&ldquo;{files[0]?.name}&rdquo;</span>} ke Trash? Kamu masih bisa memulihkannya nanti di Google Drive.
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
