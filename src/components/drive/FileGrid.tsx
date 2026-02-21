"use client";

import {
  AlertCircle,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  MoreVertical,
  Folder,
} from "lucide-react";
import { FileIcon } from "@/components/ui/FileIcon";
import {
  formatFileSize,
  isFolder,
  type DriveFile,
} from "@/lib/drive-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FileGridProps {
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  viewMode: "grid" | "list";
  onFolderOpen: (id: string, name: string) => void;
  onFileAction: (file: DriveFile, action: "delete" | "rename" | "open" | "download" | "preview") => void;
}

function SkeletonCard({ mode }: { mode: "grid" | "list" }) {
  if (mode === "list") {
    return (
      <div className="flex items-center gap-4 p-3 border-b">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-4 w-[40%]" />
        <Skeleton className="h-4 w-[10%] ml-auto" />
        <Skeleton className="h-4 w-[15%]" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }
  return (
    <Card className="overflow-hidden border-none bg-muted/20">
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function extractTags(properties?: Record<string, string>): string[] {
  if (!properties) return [];
  return Object.keys(properties)
    .filter((key) => key.startsWith("tag_"))
    .map((key) => key.replace("tag_", ""));
}


interface FileActionsProps {
  file: DriveFile;
  folder: boolean;
  onAction: (action: "delete" | "rename" | "open" | "download" | "preview") => void;
}

function FileActions({ file, folder, onAction }: FileActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {!folder && (
          <>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("preview"); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>Pratinjau (Preview)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("download"); }}>
              <Download className="mr-2 h-4 w-4" />
              <span>Download</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {file.webViewLink && !folder && (
          <DropdownMenuItem onClick={(e) => {
            e.stopPropagation();
            window.open(file.webViewLink, "_blank", "noopener,noreferrer");
          }}>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Buka di Drive</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAction("rename"); }}>
          <Edit2 className="mr-2 h-4 w-4" />
          <span>Ganti Nama</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => { e.stopPropagation(); onAction("delete"); }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function FileGrid({
  files,
  loading,
  error,
  viewMode,
  onFolderOpen,
  onFileAction,
}: FileGridProps) {
  if (loading && files.length === 0) {
    return (
      <div className={cn(
        viewMode === "grid" 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" 
          : "space-y-1"
      )}>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonCard key={i} mode={viewMode} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-bold mb-2">Gagal memuat file</h3>
        <p className="text-muted-foreground max-w-xs">{error}</p>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => window.location.reload()}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4 border-2 border-dashed rounded-3xl bg-muted/5">
        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
          <Folder className="h-10 w-10 text-primary/40" />
        </div>
        <h3 className="text-xl font-bold mb-2">Folder ini kosong</h3>
        <p className="text-muted-foreground max-w-sm">
          Belum ada file atau folder di sini. Gunakan tombol di sidebar untuk mulai menambahkan konten.
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 bg-muted/30 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b">
          <div className="w-8" />
          <div>Nama</div>
          <div className="w-24 text-right">Ukuran</div>
          <div className="w-32 text-right">Diubah</div>
          <div className="w-10" />
        </div>
        <div className="divide-y">
          {files.map((file) => {
            const folder = isFolder(file.mimeType);
            return (
              <div
                key={file.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-3 items-center hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => folder ? onFolderOpen(file.id, file.name) : file.webViewLink && window.open(file.webViewLink, "_blank")}
              >
                <div className="w-8 flex justify-center">
                  <FileIcon mimeType={file.mimeType} size={24} />
                </div>
                <div className="font-medium truncate">{file.name}</div>
                <div className="w-24 text-right text-sm text-muted-foreground">
                  {folder ? (
                    <Badge variant="outline" className="font-normal border-primary/20 bg-primary/5 text-primary">Folder</Badge>
                  ) : formatFileSize(file.size)}
                </div>
                <div className="w-32 text-right text-sm text-muted-foreground">
                  {formatDate(file.modifiedTime)}
                </div>
                <div className="w-10 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileActions 
                    file={file} 
                    folder={folder} 
                    onAction={(action) => onFileAction(file, action)} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {files.map((file) => {
        const folder = isFolder(file.mimeType);
        return (
          <Card 
            key={file.id}
            className={cn(
              "group relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30 cursor-pointer bg-card/50 backdrop-blur-sm",
              folder ? "border-l-4 border-l-primary/40" : ""
            )}
            onClick={() => folder ? onFolderOpen(file.id, file.name) : file.webViewLink && window.open(file.webViewLink, "_blank")}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-2.5 rounded-xl transition-colors",
                  folder ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary"
                )}>
                  <FileIcon mimeType={file.mimeType} size={28} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <FileActions 
                    file={file} 
                    folder={folder} 
                    onAction={(action) => onFileAction(file, action)} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm truncate pr-2" title={file.name}>
                  {file.name}
                </p>
                {/* Tags */}
                {extractTags(file.properties).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 mb-2">
                    {extractTags(file.properties).map((tag) => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="px-1.5 py-0 text-[9px] font-medium bg-primary/5 text-primary border-primary/10"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{folder ? "Folder" : formatFileSize(file.size)}</span>
                  <span>{formatDate(file.modifiedTime)}</span>
                </div>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
