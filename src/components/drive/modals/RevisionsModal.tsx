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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DriveFile } from "@/lib/drive-types";
import { formatFileSize } from "@/lib/drive-types";

interface DriveRevision {
  id: string;
  modifiedTime: string;
  size?: string;
  lastModifyingUser?: {
    displayName?: string;
  };
}

interface RevisionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile;
}

export function RevisionsModal({
  open,
  onOpenChange,
  file,
}: RevisionsModalProps) {
  const [revisions, setRevisions] = useState<DriveRevision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !file) return;
    const fetchRevisions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/drive/revisions?fileId=${file.id}`);
        if (!res.ok) throw new Error("Gagal mengambil riwayat versi");
        const data = await res.json();
        setRevisions(data.revisions || []);
      } catch (err) {
        toast.error((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchRevisions();
  }, [open, file]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <div className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle> Riwayat Versi</DialogTitle>
          <DialogDescription>
            Riwayat perubahan untuk &ldquo;{file.name}&rdquo;
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 mt-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : revisions.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              Tidak ada riwayat versi ditemukan.
            </div>
          ) : (
            <div className="space-y-4 pr-4">
              {revisions.map((rev, idx) => (
                <div key={rev.id} className="flex gap-4 items-start p-3 bg-muted/30 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {new Date(rev.modifiedTime).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {rev.lastModifyingUser && (
                      <p className="text-xs text-muted-foreground truncate">
                        Oleh: {rev.lastModifyingUser.displayName} 
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(parseInt(rev.size || "0"))} 
                      {idx === revisions.length - 1 ? " (Versi Asli)" : ""}
                      {idx === 0 ? " (Versi Saat Ini)" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
