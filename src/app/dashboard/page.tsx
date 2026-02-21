"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Home,
  FileText,
  Menu,
  Trash2
} from "lucide-react";
import { Sidebar } from "@/components/drive/Sidebar";
import { FileGrid } from "@/components/drive/FileGrid";
import { KanbanBoard } from "@/components/drive/KanbanBoard";
import { FileRevisionModal } from "@/components/drive/FileRevisionModal";
import { toast } from "sonner";
import { 
  NewFolderModal, 
  RenameModal, 
  DeleteModal,
  PreviewModal,
  RevisionsModal
} from "@/components/drive/Modals";
import { useDriveFiles, useDriveQuota, useDriveSearch } from "@/hooks/useDrive";
import type { DriveFile } from "@/lib/drive-types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const initialFolder = searchParams.get("folderId") ?? "root";
  const [currentFolder, setCurrentFolder] = useState(initialFolder);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<
    | { type: "newFolder" }
    | { type: "rename"; file: DriveFile }
    | { type: "delete"; files: DriveFile[] }
    | { type: "preview"; file: DriveFile }
    | { type: "revisions"; file: DriveFile }
    | { type: "file-revisions"; file: DriveFile }
    | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const isKanbanView = currentFolder === "kanban";

  const { files, loading, error, refetch } = useDriveFiles({
    folderId: currentFolder,
    enabled: !searchQuery && !isKanbanView,
  });
  const { quota, refetch: refetchQuota } = useDriveQuota();
  const { results: searchResults, loading: searchLoading } = useDriveSearch(searchQuery);

  const displayFiles = searchQuery ? searchResults : files;
  const isLoading = searchQuery ? searchLoading : loading;

  const handleFolderOpen = useCallback((folderId: string, folderName: string) => {
    setBreadcrumbs((prev) => [...prev, { id: folderId, name: folderName }]);
    setCurrentFolder(folderId);
  }, []);

  const handleBreadcrumb = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentFolder("root");
    } else {
      const target = breadcrumbs[index];
      setBreadcrumbs((prev) => prev.slice(0, index + 1));
      setCurrentFolder(target.id);
    }
  };

  const handleThesisTemplate = async () => {
    const title = window.prompt("Masukkan nama folder skripsi:", `Skripsi ${new Date().getFullYear()}`);
    if (!title) return;

    const t = toast.loading("Membuat struktur skripsi...");
    
    try {
      const res = await fetch("/api/drive/template/skripsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentId: currentFolder }),
      });

      if (!res.ok) throw new Error("Gagal membuat template");

      toast.success("Struktur skripsi berhasil dibuat!", { id: t });
      refetch();
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    const t = toast.loading(`Mengunggah ${selectedFiles.length} file...`);

    try {
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("parentId", currentFolder);

        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error(`Gagal mengunggah ${file.name}`);
      }

      toast.success("Semua file berhasil diunggah", { id: t });
      refetch();
      refetchQuota();
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDownload = async (file: DriveFile) => {
    const t = toast.loading(`Menyiapkan download ${file.name}...`);
    try {
      const res = await fetch(`/api/drive/download?fileId=${file.id}`);
      if (!res.ok) throw new Error("Download gagal");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download dimulai", { id: t });
    } catch (err) {
      toast.error((err as Error).message, { id: t });
    }
  };

  // Format Office yang dibuka langsung di Google Docs
  const OFFICE_MIMETYPES = new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/msword",                                                        // .doc
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",        // .xlsx
    "application/vnd.ms-excel",                                                  // .xls
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",// .pptx
    "application/vnd.ms-powerpoint",                                             // .ppt
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
  ]);

  const navigateToPreview = (file: DriveFile) => {
    // File Office → buka langsung sebagai Google Docs di tab baru
    if (OFFICE_MIMETYPES.has(file.mimeType) && file.webViewLink) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
      return;
    }

    const tags = Object.keys(file.properties || {})
      .filter(k => k.startsWith("tag_"))
      .map(k => k.replace("tag_", ""));
    const params = new URLSearchParams({
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      fileSize: file.size || "0",
      modifiedTime: file.modifiedTime || "",
      webViewLink: file.webViewLink || "",
      tags: tags.join(","),
    });
    router.push(`/dashboard/preview?${params.toString()}`);
  };

  const handleFileAction = (file: DriveFile, action: string) => {
    switch (action) {
      case "open":
        if (file.mimeType === "application/vnd.google-apps.folder") {
          setCurrentFolder(file.id);
        } else {
          navigateToPreview(file);
        }
        break;
      case "preview":
        navigateToPreview(file);
        break;
      case "download":
        handleDownload(file);
        break;
      case "rename":
        setActiveModal({ type: "rename", file });
        break;
      case "delete":
        setActiveModal({ type: "delete", files: [file] });
        break;
      case "revisions":
        setActiveModal({ type: "revisions", file });
        break;
      case "file-revisions":
        navigateToPreview(file);
        break;
    }
  };

  const handleBatchDelete = () => {
    const filesToDelete = displayFiles.filter(f => selectedFileIds.has(f.id));
    if (filesToDelete.length > 0) {
      setActiveModal({ type: "delete", files: filesToDelete });
    }
  };

  const clearSelection = () => setSelectedFileIds(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedFileIds.size === displayFiles.length && displayFiles.length > 0) {
      clearSelection();
    } else {
      setSelectedFileIds(new Set(displayFiles.map(f => f.id)));
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          currentFolder={currentFolder}
          onFolderChange={(id) => { setCurrentFolder(id); setBreadcrumbs([]); }}
          quota={quota}
          onNewFolder={() => setActiveModal({ type: "newFolder" })}
          onUpload={() => document.getElementById("file-upload-input")?.click()}
          onThesisTemplate={handleThesisTemplate}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 lg:px-6 gap-2 lg:gap-4">
          
          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 flex flex-col w-[280px]">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <Sidebar
                  currentFolder={currentFolder}
                  onFolderChange={(id) => { setCurrentFolder(id); setBreadcrumbs([]); }}
                  quota={quota}
                  onNewFolder={() => setActiveModal({ type: "newFolder" })}
                  onUpload={() => document.getElementById("file-upload-input")?.click()}
                  onThesisTemplate={handleThesisTemplate}
                />
              </SheetContent>
            </Sheet>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              className="pl-10 h-10 w-full bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/40 rounded-xl"
              placeholder="Cari file atau folder..."
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

            {/* Batch actions (shown when items are selected) */}
            {selectedFileIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2 hidden sm:inline-block">
                  {selectedFileIds.size} terpilih
                </span>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8 gap-2"
                  onClick={handleBatchDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Hapus</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-2 text-muted-foreground"
                  onClick={clearSelection}
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Batal</span>
                </Button>
                <div className="w-px h-6 bg-border mx-2"></div>
              </div>
            )}

            {/* View toggle */}
            <div className="flex items-center bg-muted/40 p-1 rounded-xl">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg shadow-none",
                viewMode === "grid" ? "bg-card shadow-sm" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg shadow-none",
                viewMode === "list" ? "bg-card shadow-sm" : "hover:bg-muted"
              )}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-2" />
              List
            </Button>
          </div>
        </header>

        {/* Content Area */}
        {isKanbanView ? (
          <KanbanBoard />
        ) : (
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-10">
            {/* Breadcrumb */}
            {!searchQuery && (
              <Breadcrumb className="mb-6">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      onClick={() => handleBreadcrumb(-1)}
                      className="cursor-pointer flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Home className="h-3.5 w-3.5" />
                      My Drive
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((crumb, i) => (
                    <div key={crumb.id} className="flex items-center gap-2">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        {i === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="font-semibold text-foreground">
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
            )}

            {/* Title & Count */}
            <div className="flex items-end justify-between mb-8">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight">
                  {searchQuery
                    ? `Hasil pencarian "${searchQuery}"`
                    : breadcrumbs.length > 0
                    ? breadcrumbs[breadcrumbs.length - 1].name
                    : "My Drive"}
                </h1>
                {!isLoading && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {displayFiles.length} item ditemukan
                  </p>
                )}
              </div>
            </div>

            {/* File grid */}
            <FileGrid
              files={displayFiles}
              loading={isLoading}
              error={error}
              viewMode={viewMode}
              selectedFiles={selectedFileIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              onFolderOpen={handleFolderOpen}
              onFileAction={handleFileAction}
            />
          </div>
        )}
      </main>

      {/* Hidden file input for upload */}
      <input 
        type="file" 
        id="file-upload-input" 
        className="hidden" 
        multiple 
        onChange={handleFileUpload}
        disabled={isUploading}
      />

      {/* Modals */}
      <NewFolderModal
        open={activeModal?.type === "newFolder"}
        onOpenChange={(open) => !open && setActiveModal(null)}
        currentFolder={currentFolder}
        onCreated={refetch}
      />
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
          onDeleted={() => {
            refetch();
            clearSelection();
          }}
        />
      )}
      {activeModal?.type === "preview" && (
        <PreviewModal
          open={true}
          onOpenChange={(open) => !open && setActiveModal(null)}
          file={activeModal.file}
          onDownload={handleDownload}
          onTagsUpdated={refetch}
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
    </div>
  );
}
