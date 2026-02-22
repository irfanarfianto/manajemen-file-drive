"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DriveFile } from "@/lib/drive-types";
import { FileIcon } from "@/components/ui/FileIcon";

interface SidebarTreeItemProps {
  folder: DriveFile;
  level: number;
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
  autoExpandPath: string[];
}

export function SidebarTreeItem({ 
  folder, 
  level, 
  currentFolder, 
  onFolderChange, 
  autoExpandPath 
}: SidebarTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const isActive = currentFolder === folder.id;
  const isFolder = folder.mimeType === "application/vnd.google-apps.folder";

  const fetchData = useCallback(async () => {
    if (hasFetched || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/drive/files?folderId=${folder.id}`);
      const data = await res.json();
      setChildren(data.files || []);
      setHasFetched(true);
    } catch (err) {
      console.error("Failed to fetch sub-folders:", err);
    } finally {
      setLoading(false);
    }
  }, [folder.id, hasFetched, loading]);

  const toggleExpand = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isFolder) return;
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded) await fetchData();
  };

  useEffect(() => {
    if (isFolder && autoExpandPath.includes(folder.id)) {
      setIsExpanded(true);
      fetchData();
    } else if (isFolder && autoExpandPath.length > 0 && !autoExpandPath.includes(folder.id) && !isActive) {
      setIsExpanded(false);
    }
  }, [autoExpandPath, folder.id, isFolder, isActive, fetchData]);

  const itemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isActive && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [isActive]);

  return (
    <div className="space-y-0.5" ref={isActive ? itemRef : null}>
      <div 
        className={cn(
          "group flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-all relative cursor-pointer",
          isActive 
            ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_0_1px_rgba(var(--primary),0.1)]" 
            : "text-foreground/60 hover:bg-muted/80 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) {
            onFolderChange(folder.id);
          } else {
            const params = new URLSearchParams({
              fileId: folder.id,
              fileName: folder.name,
              mimeType: folder.mimeType,
              fileSize: folder.size || "0",
              modifiedTime: folder.modifiedTime || "",
              webViewLink: folder.webViewLink || "",
              webContentLink: folder.webContentLink || "",
            });
            window.location.href = `/dashboard/preview?${params.toString()}`;
          }
        }}
      >
        <div 
          onClick={(e) => {
            if (isFolder) toggleExpand(e);
            else e.stopPropagation();
          }}
          className={cn(
            "p-1 -ml-1 rounded-sm hover:bg-primary/20 transition-colors mr-0.5 z-10",
            !isFolder && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight 
            className={cn(
              "h-3 w-3 transition-transform duration-200", 
              isExpanded && "rotate-90"
            )} 
          />
        </div>
        
        <FileIcon mimeType={folder.mimeType} className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">{folder.name}</span>

        {loading && (
          <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />
        )}
      </div>

      {isExpanded && children.length > 0 && (
        <div className="animate-in slide-in-from-left-2 duration-200">
          {children.map((child) => (
            <SidebarTreeItem 
              key={child.id} 
              folder={child} 
              level={level + 1} 
              currentFolder={currentFolder} 
              onFolderChange={onFolderChange} 
              autoExpandPath={autoExpandPath}
            />
          ))}
        </div>
      )}
    </div>
  );
}
