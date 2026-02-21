"use client";

import { useState, useCallback } from "react";
import { 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Home,
  FileText
} from "lucide-react";
import { Sidebar } from "@/components/drive/Sidebar";
import { FileGrid } from "@/components/drive/FileGrid";
import { toast } from "sonner";
import { 
  NewFolderModal, 
  RenameModal, 
  DeleteModal,
  PreviewModal
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
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [currentFolder, setCurrentFolder] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<
    | { type: "newFolder" }
    | { type: "rename"; file: DriveFile }
    | { type: "delete"; file: DriveFile }
    | { type: "preview"; file: DriveFile }
    | null
  >(null);
  const [isUploading, setIsUploading] = useState(false);

  const { files, loading, error, refetch } = useDriveFiles({
    folderId: currentFolder,
    enabled: !searchQuery,
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

  const handleFileAction = (file: DriveFile, action: string) => {
    switch (action) {
      case "open":
        if (file.mimeType === "application/vnd.google-apps.folder") {
          setCurrentFolder(file.id);
        } else {
          setActiveModal({ type: "preview", file });
        }
        break;
      case "preview":
        setActiveModal({ type: "preview", file });
        break;
      case "download":
        handleDownload(file);
        break;
      case "rename":
        setActiveModal({ type: "rename", file });
        break;
      case "delete":
        setActiveModal({ type: "delete", file });
        break;
    }
  };


  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        currentFolder={currentFolder}
        onFolderChange={(id) => { setCurrentFolder(id); setBreadcrumbs([]); }}
        quota={quota}
        onNewFolder={() => setActiveModal({ type: "newFolder" })}
        onUpload={() => document.getElementById("file-upload-input")?.click()}
        onThesisTemplate={handleThesisTemplate}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 gap-4">
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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-10">
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
            onFolderOpen={handleFolderOpen}
            onFileAction={handleFileAction}
          />
        </div>
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
          file={activeModal.file}
          onDeleted={refetch}
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
    </div>
  );
}
