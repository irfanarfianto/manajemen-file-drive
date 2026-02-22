"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon } from "@/components/ui/FileIcon";
import { toast } from "sonner";
import { AttachedFile, DriveFilePick } from "@/lib/kanban-types";

interface FilePickerProps {
  onSelect: (f: AttachedFile) => void;
  onCancel: () => void;
}

export function KanbanFilePicker({ onSelect, onCancel }: FilePickerProps) {
  const [query, setQuery] = useState("");
  const [files, setFiles] = useState<DriveFilePick[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ folderId: "root" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/drive/files?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFiles((data.files || []).filter((f: DriveFilePick) => f.mimeType !== "application/vnd.google-apps.folder"));
    } catch {
      toast.error("Gagal mengambil daftar file");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    search("");
  }, []);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(val), 400);
  };

  return (
    <div className="border rounded-xl bg-card shadow-lg mt-2 overflow-hidden">
      <div className="p-2 border-b flex items-center gap-2">
        < Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          autoFocus
          placeholder="Cari file di Drive..."
          className="text-sm flex-1 bg-transparent outline-none"
          value={query}
          onChange={e => handleQueryChange(e.target.value)}
        />
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="h-48">
        {loading ? (
          <div className="flex justify-center pt-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">Tidak ada file ditemukan</p>
        ) : (
          <div className="p-1">
            {files.map(f => (
              <button
                key={f.id}
                onClick={() => onSelect({ fileId: f.id, fileName: f.name, mimeType: f.mimeType, webViewLink: f.webViewLink })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <FileIcon mimeType={f.mimeType} className="h-5 w-5 flex-shrink-0" />
                <span className="text-xs truncate flex-1">{f.name}</span>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
