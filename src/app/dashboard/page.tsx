"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  X,
  LayoutGrid,
  List,
  Home,
  Menu,
  Search,
  Trash2,
  LogOut,
  Loader2,
  FileText,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";
import { Sidebar } from "@/components/drive/Sidebar";
import { FileGrid } from "@/components/drive/FileGrid";
import { KanbanBoard } from "@/components/drive/KanbanBoard";
import { FileRevisionModal } from "@/components/drive/FileRevisionModal";
import { toast } from "sonner";
import { NewFolderModal } from "@/components/drive/modals/NewFolderModal";
import { RenameModal } from "@/components/drive/modals/RenameModal";
import { DeleteModal } from "@/components/drive/modals/DeleteModal";
import { RevisionsModal } from "@/components/drive/modals/RevisionsModal";
import { ThesisTemplateModal } from "@/components/drive/modals/ThesisTemplateModal";
import { UploadModal } from "@/components/drive/modals/UploadModal";
import { DashboardOverview } from "@/components/drive/DashboardOverview";
import { useDriveFiles, useDriveQuota, useDriveSearch } from "@/hooks/useDrive";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { type DriveFile } from "@/lib/drive-types";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get("folderId") ?? "dashboard";
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [isTrashMode, setIsTrashMode] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<
    | { type: "newFolder" }
    | { type: "rename"; file: DriveFile }
    | { type: "delete"; files: DriveFile[]; permanent?: boolean }
    | { type: "revisions"; file: DriveFile }
    | { type: "file-revisions"; file: DriveFile }
    | { type: "thesisTemplate" }
    | { type: "upload" }
    | null
  >(null);
  const { data: session } = useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const isKanbanView = currentFolder === "kanban";
  const isDashboardView = currentFolder === "dashboard";

  const currentFolderName = isDashboardView ? "Drive" : 
    currentFolder === "root" ? "My Drive" :
    currentFolder === "trash" ? "Trash" :
    currentFolder === "kanban" ? "Drive" :
    (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : "Drive");

  const { files, loading: filesLoading, error: filesError, refetch } = useDriveFiles({
    folderId: currentFolder,
    enabled: !searchQuery && !isKanbanView && !isDashboardView,
  });
  const { quota, refetch: refetchQuota } = useDriveQuota();
  const { results: searchResults, loading: searchLoading, error: searchError } = useDriveSearch(searchQuery);

  const displayFiles = searchQuery ? searchResults : files;
  const isLoading = searchQuery ? searchLoading : filesLoading;
  const currentError = searchQuery ? searchError : filesError;

  const handleFolderOpen = useCallback((folderId: string, folderName: string) => {
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolder(folderId);
    setSelectedFileIds(new Set());
    // if we opened a folder from a known context, the context stays the same
  }, []);

  const handleBreadcrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      if (isTrashMode) {
        setCurrentFolder("trash");
      } else {
        setCurrentFolder("dashboard");
      }
      setSelectedFileIds(new Set());
      return;
    }
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentFolder(newBreadcrumbs[index].id);
    setSelectedFileIds(new Set());
  };



  const handleFolderChange = useCallback((id: string) => {
    setCurrentFolder(id);
    setSelectedFileIds(new Set());
    if (id === "trash") setIsTrashMode(true);
    else if (id === "dashboard" || id === "root" || id === "kanban") setIsTrashMode(false);
    
    if (id === "dashboard" || id === "kanban" || id === "trash" || id === "root") {
      setBreadcrumbs([]);
    }
  }, []);

  // Sync breadcrumbs for deep folder navigation (from sidebar tree or direct ID)
  useEffect(() => {
    if (currentFolder === "dashboard" || currentFolder === "kanban" || currentFolder === "trash" || currentFolder === "root") {
      return;
    }

    const fetchPath = async () => {
      try {
        const res = await fetch(`/api/drive/file-path?fileId=${currentFolder}`);
        const data = await res.json();
        if (data.folderPath) {
          setBreadcrumbs(data.folderPath);
          setIsTrashMode(!!data.isTrashed);
        }
      } catch (err) {
        console.error("Failed to fetch path for breadcrumbs:", err);
      }
    };
    fetchPath();
  }, [currentFolder]);

  const handleFileAction = async (file: DriveFile, action: string) => {
    if (action === "rename") {
      setActiveModal({ type: "rename", file });
    } else if (action === "delete") {
      setActiveModal({ type: "delete", files: [file] });
    } else if (action === "permanent-delete") {
      setActiveModal({ type: "delete", files: [file], permanent: true });
    } else if (action === "restore") {
      const promise = fetch("/api/drive/file", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, restore: true }),
      }).then((res) => {
        if (!res.ok) throw new Error("Gagal memulihkan file");
        refetch();
        return res.json();
      });
      toast.promise(promise, {
        loading: "Memulihkan file...",
        success: "File berhasil dipulihkan",
        error: (err) => err.message,
      });
    } else if (action === "preview") {
      const params = new URLSearchParams({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        webViewLink: file.webViewLink || "",
        fileSize: file.size || "0",
        modifiedTime: file.modifiedTime || ""
      });
      router.push(`/dashboard/preview?${params.toString()}`);
    } else if (action === "revisions") {
      setActiveModal({ type: "revisions", file });
    } else if (action === "file-revisions") {
      setActiveModal({ type: "file-revisions", file });
    } else if (action === "download") {
      toast.info("Fitur download sedang dalam pengembangan");
    } else if (action === "open") {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        handleFolderOpen(file.id, file.name);
      } else if (file.webViewLink) {
        window.open(file.webViewLink, "_blank");
      }
    }
  };

  const clearSelection = () => setSelectedFileIds(new Set());

  const toggleSelect = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedFileIds.size === displayFiles.length) {
      clearSelection();
    } else {
      setSelectedFileIds(new Set(displayFiles.map((f) => f.id)));
    }
  };

  const handleBatchDelete = () => {
    const selectedFiles = displayFiles.filter((f) => selectedFileIds.has(f.id));
    if (selectedFiles.length > 0) {
      if (currentFolder === "trash") {
        setActiveModal({ type: "delete", files: selectedFiles, permanent: true });
      } else {
        setActiveModal({ type: "delete", files: selectedFiles });
      }
    }
  };

  const handleBatchRestore = async () => {
    const selectedFiles = displayFiles.filter((f) => selectedFileIds.has(f.id));
    if (selectedFiles.length === 0) return;

    const promise = Promise.all(
      selectedFiles.map((file) =>
        fetch("/api/drive/file", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: file.id, restore: true }),
        }).then((res) => {
          if (!res.ok) throw new Error("Gagal");
        })
      )
    ).then(() => {
      clearSelection();
      refetch();
    });

    toast.promise(promise, {
      loading: "Memulihkan file...",
      success: `Berhasil memulihkan ${selectedFiles.length} item`,
      error: "Gagal memulihkan beberapa file",
    });
  };

  const handleUpload = useCallback(() => setActiveModal({ type: "upload" }), []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  const handleNewFolder = useCallback(() => setActiveModal({ type: "newFolder" }), []);
  const handleThesisTemplate = useCallback(() => setActiveModal({ type: "thesisTemplate" }), []);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar 
        currentFolder={currentFolder} 
        isTrashMode={isTrashMode}
        onFolderChange={handleFolderChange}
        quota={quota}
        onUpload={handleUpload}
        onNewFolder={handleNewFolder}
        onThesisTemplate={handleThesisTemplate}
        currentFolderName={currentFolderName}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 gap-2 lg:gap-4">
          
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <Sidebar 
                  currentFolder={currentFolder} 
                  isTrashMode={isTrashMode}
                  onFolderChange={handleFolderChange}
                  quota={quota}
                  onUpload={handleUpload}
                  onNewFolder={handleNewFolder}
                  onThesisTemplate={handleThesisTemplate}
                  currentFolderName={currentFolderName}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Cari file kuliah, modul, atau script..."
              className="pl-10 h-10 bg-muted/50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3">
            {selectedFileIds.size > 0 && (
              <div className="hidden sm:flex items-center bg-muted/50 rounded-xl px-2 py-1 gap-1 border border-border/50 animate-in zoom-in-95 duration-200">
                <span className="text-sm font-medium text-muted-foreground mr-2 hidden sm:inline-block">
                  {selectedFileIds.size} terpilih
                </span>
                
                {currentFolder === "trash" ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-2 bg-background hover:bg-background/80"
                      onClick={handleBatchRestore}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline-block">Pulihkan</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-8 gap-2"
                      onClick={handleBatchDelete}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline-block">Hapus Permanen</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-8 gap-2"
                    onClick={handleBatchDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline-block">Hapus</span>
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-2 text-muted-foreground"
                  onClick={clearSelection}
                >
                  <X className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline-block">Batal</span>
                </Button>
              </div>
            )}

            <div className="flex items-center gap-3 bg-muted/30 hover:bg-muted/50 transition-colors pl-1 pr-3 py-1 rounded-2xl border border-border/40">
              <Avatar className="h-8 w-8 border-2 border-background shadow-sm ring-1 ring-border/50">
                <AvatarImage src={session?.user?.image ?? ""} alt={session?.user?.name ?? ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                  {session?.user?.name?.charAt(0) ?? "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="hidden md:flex flex-col min-w-0">
                <p className="text-xs font-bold truncate text-foreground leading-none mb-1">
                  {session?.user?.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-none">
                  {session?.user?.email}
                </p>
              </div>

              <div className="w-px h-4 bg-border/40 mx-1 hidden md:block"></div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 rounded-xl"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area - Prioritize search results if searchQuery exists */}
        {searchQuery ? (
          <div className="flex-1 overflow-y-auto p-4 lg:p-10">
            {/* Title & Count (Always show for search results) */}
            <div className="flex items-end justify-between mb-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Hasil pencarian &quot;{searchQuery}&quot;
                </h1>
                {!isLoading && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {displayFiles.length} item ditemukan
                  </p>
                )}
              </div>
            </div>

            <FileGrid
              files={displayFiles}
              loading={isLoading}
              error={currentError}
              viewMode={viewMode}
              selectedFiles={selectedFileIds}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
              onFolderOpen={handleFolderOpen}
              onFileAction={handleFileAction}
              searchQuery={searchQuery}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 lg:p-10">
            {/* View Switching Title & Breadcrumbs */}
            {!isDashboardView && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex flex-col gap-1">
                  <h1 className="text-3xl font-extrabold tracking-tight">
                    {isKanbanView ? "Manajemen Tugas" : 
                     currentFolder === "root" ? "My Drive" :
                     currentFolder === "trash" ? "Trash" :
                     breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : "Semua File"}
                  </h1>
                  <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink 
                          onClick={() => handleBreadcrumb(-1)}
                          className="cursor-pointer flex items-center gap-1 hover:text-primary transition-colors"
                        >
                          {isTrashMode ? (
                            <>
                              <Trash2 className="h-3.5 w-3.5" />
                              Trash
                            </>
                          ) : (
                            <>
                              <Home className="h-3.5 w-3.5" />
                              Drive
                            </>
                          )}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.id} className="flex items-center gap-2">
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {i === breadcrumbs.length - 1 ? (
                              <BreadcrumbPage className="font-semibold text-primary">
                                {crumb.name}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink 
                                onClick={() => handleBreadcrumb(i)}
                                className="cursor-pointer hover:text-primary transition-colors"
                              >
                                {crumb.name}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </div>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                {!isKanbanView && (
                  <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-2xl border border-border/50">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-9 px-3 gap-2 rounded-xl transition-all font-semibold",
                        viewMode === "grid" && "shadow-sm"
                      )}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-9 px-3 gap-2 rounded-xl transition-all font-semibold",
                        viewMode === "list" && "shadow-sm"
                      )}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                      List
                    </Button>
                  </div>
                )}
              </div>
            )}

            {isKanbanView ? (
              <KanbanBoard />
            ) : isDashboardView ? (
              <DashboardOverview 
                onKanbanOpen={() => setCurrentFolder("kanban")}
                onNewFolder={() => setActiveModal({ type: "newFolder" })}
                onUpload={handleUpload}
                onViewFile={(file) => {
                  const params = new URLSearchParams({
                    fileId: file.id,
                    fileName: file.name,
                    mimeType: file.mimeType,
                    webViewLink: file.webViewLink || "",
                    fileSize: file.size || "0",
                    modifiedTime: file.modifiedTime || ""
                  });
                  router.push(`/dashboard/preview?${params.toString()}`);
                }}
              />
            ) : (
              <FileGrid
                files={displayFiles}
                loading={isLoading}
                error={currentError}
                viewMode={viewMode}
                selectedFiles={selectedFileIds}
                onToggleSelect={toggleSelect}
                onToggleAll={toggleAll}
                onFolderOpen={handleFolderOpen}
                onFileAction={handleFileAction}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeModal?.type === "newFolder" && (
        <NewFolderModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          currentFolder={currentFolder === "dashboard" ? "root" : currentFolder}
          onCreated={refetch}
        />
      )}
      {activeModal?.type === "rename" && (
        <RenameModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          file={activeModal.file}
          onRenamed={refetch}
        />
      )}
      {activeModal?.type === "delete" && (
        <DeleteModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          files={activeModal.files}
          isPermanent={(activeModal as { type: "delete", files: DriveFile[], permanent?: boolean }).permanent}
          onDeleted={() => {
            clearSelection();
            refetch();
            refetchQuota();
          }}
        />
      )}

      {activeModal?.type === "revisions" && (
        <RevisionsModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          file={activeModal.file}
        />
      )}
      {activeModal?.type === "file-revisions" && (
        <FileRevisionModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          file={activeModal.file}
        />
      )}
      {activeModal?.type === "thesisTemplate" && (
        <ThesisTemplateModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          currentFolder={currentFolder === "dashboard" ? "root" : currentFolder}
          onCreated={refetch}
        />
      )}
      {activeModal?.type === "upload" && (
        <UploadModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          currentFolderId={currentFolder === "dashboard" || currentFolder === "root" ? "root" : currentFolder}
          currentFolderName={currentFolderName}
          onUploadSuccess={() => {
            refetch();
            refetchQuota();
          }}
        />
      )}
    </div>
  );
}
