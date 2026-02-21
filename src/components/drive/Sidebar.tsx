"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  FolderPlus, 
  Upload, 
  HardDrive, 
  LogOut,
  Loader2,
  Cloud,
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
          className="w-full justify-start gap-2 shadow-sm"
          id="sidebar-upload-btn"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <Button 
          variant="secondary" 
          onClick={onNewFolder} 
          className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary"
          id="sidebar-new-folder-btn"
        >
          <FolderPlus className="h-4 w-4" />
          Folder Baru
        </Button>
      </div>

      <Separator className="mx-4 w-auto mb-4" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1" aria-label="Drive navigation">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentFolder === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 px-3",
                currentFolder === item.id ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
              )}
              onClick={() => onFolderChange(item.id)}
              id={`nav-${item.id}`}
            >
              <span className={cn(
                "p-1 rounded-md",
                currentFolder === item.id ? "p-1 rounded-md bg-primary/20" : "text-muted-foreground"
              )}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
            </Button>
          ))}
        </nav>

        <div className="mt-6 mb-2 px-3">
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


      {/* Storage Quota */}
      {quota && (
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3 w-3" />
              <span>Penyimpanan</span>
            </div>
          </div>
          <div className="space-y-2">
            <Progress value={usagePercent} className="h-1.5 bg-muted" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">
                {formatBytes(quota.usage)} terpakai
              </span>
              <span className="font-medium">
                {usagePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* User Profile */}
      <div className="p-4 bg-muted/30 border-t mt-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback>{session?.user?.name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none mb-1">
              {session?.user?.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
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
