"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  FolderPlus, 
  Upload, 
  HardDrive, 
  LogOut,
  Loader2,
  ChevronRight,
  Folder,
  FolderOpen,
  GraduationCap,
  SquareKanban,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileIcon } from "@/components/ui/FileIcon";
import { cn } from "@/lib/utils";

interface DriveNode {
  id: string;
  name: string;
  mimeType: string;
}

interface SidebarProps {
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
  quota: { limit: number | null; usage: number } | null;
  onNewFolder: () => void;
  onUpload: () => void;
  onThesisTemplate: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

// ─── Recursive Tree Item ──────────────────────────────────────────────────
interface SidebarTreeItemProps {
  folder: DriveNode;
  level: number;
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
}

function SidebarTreeItem({ folder, level, currentFolder, onFolderChange }: SidebarTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<DriveNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const isActive = currentFolder === folder.id;

  const toggleExpand = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded && !hasFetched) {
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
    }
  };

  return (
    <div className="space-y-0.5">
      <div 
        className={cn(
          "group flex items-center gap-1.5 w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition-all relative overflow-hidden cursor-pointer",
          isActive 
            ? "bg-primary/10 text-primary font-semibold" 
            : "text-foreground/60 hover:bg-muted/80 hover:text-foreground"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => {
          const isFolder = folder.mimeType === "application/vnd.google-apps.folder";
          if (isFolder) {
            onFolderChange(folder.id);
          } else {
            const params = new URLSearchParams({
              fileId: folder.id,
              fileName: folder.name,
              mimeType: folder.mimeType,
            });
            window.location.href = `/dashboard/preview?${params.toString()}`;
          }
        }}
      >
        <div 
          onClick={(e) => {
            const isFolder = folder.mimeType === "application/vnd.google-apps.folder";
            if (isFolder) toggleExpand(e);
            else e.stopPropagation();
          }}
          className={cn(
            "p-1 -ml-1 rounded-sm hover:bg-primary/20 transition-colors mr-0.5 z-10",
            folder.mimeType !== "application/vnd.google-apps.folder" && "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight 
            className={cn(
              "h-3 w-3 transition-transform duration-200", 
              isExpanded && "rotate-90"
            )} 
          />
        </div>
        
        {folder.mimeType === "application/vnd.google-apps.folder" ? (
          <Folder className={cn("h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground/60")} />
        ) : (
          <div className="h-3.5 w-3.5 shrink-0 flex items-center justify-center opacity-70">
            <FileIcon mimeType={folder.mimeType} className="h-3 w-3" />
          </div>
        )}
        
        <span className="truncate flex-1">{folder.name}</span>
        {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />}
      </div>

      {/* Animated Height Container */}
      <div 
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          {loading ? (
            <div className="py-2 flex items-center gap-2" style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}>
              <Loader2 className="h-2.5 w-2.5 animate-spin text-primary/30" />
              <span className="text-[10px] text-muted-foreground/40 font-medium">Memuat...</span>
            </div>
          ) : (
            children.map((child) => (
              <SidebarTreeItem 
                key={child.id} 
                folder={child} 
                level={level + 1} 
                currentFolder={currentFolder} 
                onFolderChange={onFolderChange}
              />
            ))
          )}
          {hasFetched && children.length === 0 && !loading && (
             <p 
              className="py-1 text-[10px] text-muted-foreground/30 italic font-medium" 
              style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
             >
               Kosong
             </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ───────────────────────────────────────────────
export function Sidebar({
  currentFolder,
  onFolderChange,
  quota,
  onNewFolder,
  onUpload,
  onThesisTemplate,
}: SidebarProps) {
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  
  const [rootFolders, setRootFolders] = useState<DriveNode[]>([]);
  const [rootLoading, setRootLoading] = useState(false);

  useEffect(() => {
    const fetchRoot = async () => {
      setRootLoading(true);
      try {
        const res = await fetch(`/api/drive/files?folderId=root`);
        const data = await res.json();
        setRootFolders(data.files || []);
      } catch (err) {
        console.error("Failed to fetch root folders:", err);
      } finally {
        setRootLoading(false);
      }
    };
    fetchRoot();
  }, []);

  const usagePercent =
    quota?.limit && quota.usage
      ? Math.min((quota.usage / quota.limit) * 100, 100)
      : 0;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const navItems = [
    {
      id: "root",
      label: "My Drive",
      icon: <HardDrive className="h-4 w-4" />,
    },
    {
      id: "kanban",
      label: "Kanban Tugas",
      icon: <SquareKanban className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z" fill="#0066DA" />
            <path d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z" fill="#00AC47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z" fill="#EA4335" />
            <path d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z" fill="#00832D" />
            <path d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z" fill="#2684FC" />
            <path d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z" fill="#FFBA00" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight">Drive Manager</span>
      </div>

      <div className="px-4 mb-4 flex flex-col gap-2">
        <Button 
          onClick={onUpload} 
          className="w-full justify-start gap-2 shadow-sm relative overflow-hidden group"
          id="sidebar-upload-btn"
        >
          <Upload className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
          Upload File
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Button>
        <Button 
          variant="secondary" 
          onClick={onNewFolder} 
          className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary transition-all"
          id="sidebar-new-folder-btn"
        >
          <FolderPlus className="h-4 w-4" />
          Folder Baru
        </Button>
      </div>

      <Separator className="mx-4 w-auto mb-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 no-scrollbar">
        <nav className="space-y-1 mb-6" aria-label="Drive navigation">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentFolder === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 px-3 transition-all",
                currentFolder === item.id ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
              )}
              onClick={() => onFolderChange(item.id)}
              id={`nav-${item.id}`}
            >
              <span className={cn(
                "p-1 rounded-md transition-colors",
                currentFolder === item.id ? "bg-primary/20" : "text-muted-foreground"
              )}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>

        {/* Real Tree View with Expand/Collapse */}
        <div className="mb-6 space-y-2">
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Struktur Folder
          </p>
          <div className="space-y-0.5">
            {rootLoading ? (
              <div className="px-3 py-4 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
                <span className="text-[10px] text-muted-foreground/50 font-medium">Memuat struktur...</span>
              </div>
            ) : (
              rootFolders.map((folder) => (
                <SidebarTreeItem 
                  key={folder.id} 
                  folder={folder} 
                  level={0} 
                  currentFolder={currentFolder} 
                  onFolderChange={onFolderChange} 
                />
              ))
            )}
          </div>
        </div>

        <div className="mb-2 px-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Alat Mahasiswa
          </p>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 text-sm hover:bg-primary/5 hover:text-primary transition-colors group"
            onClick={onThesisTemplate}
            id="sidebar-skripsi-template-btn"
          >
            <span className="p-1 rounded-md text-muted-foreground group-hover:text-primary group-hover:bg-primary/10">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-medium">Template Skripsi</span>
          </Button>
        </div>
      </ScrollArea>

      {/* Storage & User */}
      <div className="p-4 bg-muted/20 border-t mt-auto">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <Cloud className="h-4 w-4 text-primary" />
              <span>Penyimpanan</span>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              {usagePercent.toFixed(1)}%
            </span>
          </div>
          <Progress value={usagePercent} className="h-1.5" />
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70 font-medium">
             <span>{quota ? formatBytes(quota.usage) : "0 MB"} terpakai</span>
             <span>{quota?.limit ? formatBytes(quota.limit) : "Tanpa batas"}</span>
          </div>
        </div>

        <Separator className="mb-4 opacity-50" />

        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border-2 border-background shadow-sm hover:scale-105 transition-transform flex-shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {session?.user?.name?.charAt(0) ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate text-foreground leading-tight">{session?.user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Keluar"
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
