"use client";

import { useState, useEffect } from "react";
import { 
  FolderPlus, 
  Upload, 
  HardDrive, 
  Trash2, 
  Boxes, 
  SquareKanban, 
  Layout, 
  Loader2,
  GraduationCap,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DriveFile } from "@/lib/drive-types";
import { SidebarTreeItem } from "./sidebar/SidebarTreeItem";
import { SidebarQuota } from "./sidebar/SidebarQuota";

interface SidebarProps {
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
  quota: { limit: number | null; usage: number } | null;
  onNewFolder: () => void;
  onUpload: () => void;
  onThesisTemplate: () => void;
  currentFolderName: string;
  isTrashMode?: boolean;
}

export function Sidebar({
  currentFolder,
  onFolderChange,
  quota,
  onNewFolder,
  onUpload,
  onThesisTemplate,
  currentFolderName,
  isTrashMode,
}: SidebarProps) {
  const [rootFolders, setRootFolders] = useState<DriveFile[]>([]);
  const [rootLoading, setRootLoading] = useState(false);
  const [autoExpandPath, setAutoExpandPath] = useState<string[]>([]);

  // Navigasi Item
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Layout className="h-4 w-4" /> },
    { id: "root", label: "My Drive", icon: <HardDrive className="h-4 w-4" /> },
    { id: "shared", label: "Dibagikan", icon: <Users className="h-4 w-4" /> },
    { id: "kanban", label: "Task Board", icon: <SquareKanban className="h-4 w-4" /> },
    { id: "trash", label: "Trash", icon: <Trash2 className="h-4 w-4" /> },
  ];

  const [baseFolderId, setBaseFolderId] = useState<"root" | "shared">("root");

  // Determine base folder depending on menu context
  useEffect(() => {
    if (currentFolder === "shared") {
      setBaseFolderId("shared");
    } else if (currentFolder === "root" || currentFolder === "dashboard" || currentFolder === "trash" || currentFolder === "kanban") {
      setBaseFolderId("root");
    }
  }, [currentFolder]);

  // Fetch root folders
  useEffect(() => {
    const fetchRoot = async () => {
      setRootLoading(true);
      try {
        const res = await fetch(`/api/drive/files?folderId=${baseFolderId}`);
        const data = await res.json();
        setRootFolders(data.files || []);
      } catch (err) {
        console.error("Failed to fetch root folders:", err);
      } finally {
        setRootLoading(false);
      }
    };
    fetchRoot();
  }, [baseFolderId]);

  // Fetch auto-expand path when folder changes
  useEffect(() => {
    if (currentFolder === "dashboard" || currentFolder === "shared" || currentFolder === "root" || currentFolder === "trash" || currentFolder === "kanban") {
      setAutoExpandPath([]);
      return;
    }
    const fetchPath = async () => {
      try {
        const res = await fetch(`/api/drive/file-path?fileId=${currentFolder}`);
        const data = await res.json();
        if (data.folderPath) {
          setAutoExpandPath(data.folderPath.map((p: { id: string }) => p.id));
        }
      } catch (err) {
        console.error("Failed to fetch path:", err);
      }
    };
    fetchPath();
  }, [currentFolder]);

  return (
    <aside className="w-64 border-r bg-background flex flex-col h-full shadow-lg">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Boxes className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">Drive Workspace</span>
      </div>

      <div className="px-4 mb-4 flex flex-col gap-2">
        <Button 
          onClick={onUpload} 
          disabled={isTrashMode}
          className="w-full justify-start gap-2 shadow-sm relative overflow-hidden group h-auto py-2.5 px-3"
          id="sidebar-upload-btn"
        >
          <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
          <div className="flex flex-col items-start min-w-0">
            <span className="text-sm font-semibold leading-none mb-0.5">Upload File</span>
            <span className="text-[10px] opacity-70 leading-none truncate w-full text-left">
              {isTrashMode ? "Tidak tersedia di Trash" : `ke ${currentFolderName}`}
            </span>
          </div>
          {!isTrashMode && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </Button>

      </div>

      <Separator className="mx-4 w-auto mb-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 no-scrollbar">
        <nav className="space-y-1 mb-6" aria-label="Drive navigation">
          {navItems.map((item) => {
            const isActive = 
              item.id === "trash" ? (currentFolder === "trash" || !!isTrashMode)
              : item.id === "shared" ? currentFolder === "shared"
              : item.id === "root" 
                ? (currentFolder === "root" || (currentFolder !== "dashboard" && currentFolder !== "kanban" && currentFolder !== "trash" && currentFolder !== "shared" && !isTrashMode))
                : currentFolder === item.id;
            return (
            <Button
              key={item.id}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 px-3 transition-all",
                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
              )}
              onClick={() => onFolderChange(item.id)}
              id={`nav-${item.id}`}
            >
              <span className={cn(
                "p-1 rounded-md transition-colors",
                isActive ? "bg-primary/20" : "text-muted-foreground"
              )}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Button>
            );
          })}

          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 transition-all hover:bg-primary/5 hover:text-primary group"
            onClick={onThesisTemplate}
            id="sidebar-skripsi-template-btn"
          >
            <span className="p-1 rounded-md text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-medium">Template Skripsi</span>
          </Button>
        </nav>

        {/* Real Tree View with Expand/Collapse */}
        <div className="mb-6 space-y-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Struktur Folder
          </p>
          <div className="space-y-0.5">
            {rootLoading ? (
              <div className="px-3 py-8 flex flex-col items-center justify-center gap-2 w-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">Memuat struktur...</span>
              </div>
            ) : (
              <div className="min-w-full w-max pr-8">
                {rootFolders.map((folder) => (
                  <SidebarTreeItem 
                    key={folder.id} 
                    folder={folder} 
                    level={0} 
                    currentFolder={currentFolder} 
                    onFolderChange={onFolderChange} 
                    autoExpandPath={autoExpandPath}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>

      <SidebarQuota quota={quota} />
    </aside>
  );
}
