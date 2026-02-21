"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LogOut, Loader2, ArrowLeft,
  ChevronRight, Folder, FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileIcon } from "@/components/ui/FileIcon";
import { cn } from "@/lib/utils";
import { Suspense } from "react";

// ─── Types ────────────────────────────────────────────────────────────────
interface FolderNode {
  id: string;
  name: string;
}
interface DriveSibling {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  modifiedTime?: string;
}

// ─── File browser sidebar ─────────────────────────────────────────────────
function FileBrowser({ currentFileId }: { currentFileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [folderPath, setFolderPath] = useState<FolderNode[]>([]);
  const [siblings, setSiblings] = useState<DriveSibling[]>([]);
  const [parentId, setParentId] = useState<string>("");

  const OFFICE_TYPES = new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.ms-powerpoint",
  ]);

  useEffect(() => {
    if (!currentFileId) return;
    setLoading(true);
    fetch(`/api/drive/file-path?fileId=${currentFileId}`)
      .then(r => r.json())
      .then(data => {
        setFolderPath(data.folderPath ?? []);
        setSiblings(data.siblings ?? []);
        setParentId(data.parentId ?? "root");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentFileId]);

  const openFile = (file: DriveSibling) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      // Buka folder di dashboard
      router.push(`/dashboard?folderId=${file.id}`);
      return;
    }
    if (OFFICE_TYPES.has(file.mimeType) && file.webViewLink) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
      return;
    }
    const params = new URLSearchParams({
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      webViewLink: file.webViewLink ?? "",
      fileSize: file.size ?? "0",
    });
    router.push(`/dashboard/preview?${params}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 px-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
        <p className="text-xs text-muted-foreground text-center">Memuat struktur folder...</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 px-2">
      <div className="py-3 space-y-1">

        {/* Breadcrumb path — root → ... → parent */}
        <div className="px-2 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">Lokasi File</p>
          <div className="space-y-0.5">
            {/* Root */}
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left px-1 py-1 rounded hover:bg-muted/50"
            >
              <Folder className="h-3.5 w-3.5 flex-shrink-0" />
              <span>My Drive</span>
            </button>

            {/* Folder ancestors */}
            {folderPath.map((folder, i) => (
              <button
                key={folder.id}
                onClick={() => router.push(`/dashboard?folderId=${folder.id}`)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-full text-left px-1 py-1 rounded hover:bg-muted/50"
                style={{ paddingLeft: `${(i + 1) * 12 + 4}px` }}
              >
                <ChevronRight className="h-3 w-3 flex-shrink-0 opacity-40" />
                <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-2" />

        {/* Siblings — files in the same folder */}
        <div className="px-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            Isi Folder
          </p>
          <div className="space-y-0.5">
            {siblings.length === 0 && (
              <p className="text-xs text-muted-foreground/50 px-1">Tidak ada file lain.</p>
            )}
            {siblings.map(file => {
              const isFolder = file.mimeType === "application/vnd.google-apps.folder";
              const isCurrent = file.id === currentFileId;

              return (
                <button
                  key={file.id}
                  onClick={() => openFile(file)}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg transition-all text-xs",
                    isCurrent
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground/70 hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {isFolder
                    ? <FolderOpen className={cn("h-4 w-4 flex-shrink-0", isCurrent ? "text-primary" : "text-muted-foreground")} />
                    : <FileIcon mimeType={file.mimeType} className="h-4 w-4 flex-shrink-0" />
                  }
                  <span className="truncate flex-1">{file.name}</span>
                  {isCurrent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

// ─── Sidebar wrapper ──────────────────────────────────────────────────────
function PreviewSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [signingOut, setSigningOut] = useState(false);

  const fileId = params.get("fileId") ?? "";

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen overflow-hidden flex-shrink-0">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z" fill="#0066DA" />
            <path d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z" fill="#00AC47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z" fill="#EA4335" />
            <path d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z" fill="#00832D" />
            <path d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z" fill="#2684FC" />
            <path d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z" fill="#FFBA00" />
          </svg>
        </div>
        <span className="font-bold text-base tracking-tight">Drive Manager</span>
      </div>

      {/* Back button */}
      <div className="px-3 pt-3 pb-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary text-sm"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Kembali ke Dashboard
        </Button>
      </div>

      <Separator className="mx-3 w-auto" />

      {/* File browser */}
      <FileBrowser currentFileId={fileId} />

      {/* User */}
      <div className="p-3 bg-muted/30 border-t mt-auto">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 border flex-shrink-0">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback className="text-xs">{session?.user?.name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate leading-none mb-0.5">{session?.user?.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{session?.user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
          >
            {signingOut ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Suspense fallback={
          <aside className="w-64 border-r bg-card flex items-center justify-center h-screen">
            <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
          </aside>
        }>
          <PreviewSidebar />
        </Suspense>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
