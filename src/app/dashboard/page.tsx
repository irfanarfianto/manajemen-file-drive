"use client";

import { useState, useCallback } from "react";
import { Sidebar } from "@/components/drive/Sidebar";
import { FileGrid } from "@/components/drive/FileGrid";
import { useDriveFiles, useDriveQuota, useDriveSearch } from "@/hooks/useDrive";
import type { DriveFile } from "@/lib/drive-types";
import styles from "./dashboard.module.css";

// =============================================
// Modals
// =============================================
interface ModalProps {
  onClose: () => void;
}

function NewFolderModal({
  onClose,
  currentFolder,
  onCreated,
}: ModalProps & { currentFolder: string; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drive/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), parentId: currentFolder }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal membuat folder");
      }
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Folder Baru</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <input
            className={styles.modalInput}
            type="text"
            placeholder="Nama folder..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
            id="new-folder-name-input"
          />
          {error && <p className={styles.modalError}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Batal</button>
          <button
            className={styles.btnPrimary}
            onClick={handleCreate}
            disabled={!name.trim() || loading}
            id="create-folder-submit"
          >
            {loading ? "Membuat..." : "Buat Folder"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RenameModal({
  file,
  onClose,
  onRenamed,
}: ModalProps & { file: DriveFile; onRenamed: () => void }) {
  const [name, setName] = useState(file.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRename = async () => {
    if (!name.trim() || name === file.name) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/drive/file", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id, name: name.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Gagal rename");
      }
      onRenamed();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Rename</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <input
            className={styles.modalInput}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
            id="rename-input"
          />
          {error && <p className={styles.modalError}>{error}</p>}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Batal</button>
          <button
            className={styles.btnPrimary}
            onClick={handleRename}
            disabled={!name.trim() || name === file.name || loading}
            id="rename-submit"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({
  file,
  onClose,
  onDeleted,
}: ModalProps & { file: DriveFile; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch("/api/drive/file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId: file.id }),
      });
      onDeleted();
      onClose();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Hapus ke Trash</h2>
          <button className={styles.modalClose} onClick={onClose} aria-label="Tutup">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.deleteText}>
            Yakin ingin memindahkan <strong>&ldquo;{file.name}&rdquo;</strong> ke Trash?
          </p>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Batal</button>
          <button
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={loading}
            id="delete-confirm"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================
// Main Dashboard
// =============================================
export default function DashboardPage() {
  const [currentFolder, setCurrentFolder] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<
    | { type: "newFolder" }
    | { type: "rename"; file: DriveFile }
    | { type: "delete"; file: DriveFile }
    | null
  >(null);

  const { files, loading, error, refetch } = useDriveFiles({
    folderId: currentFolder,
    enabled: !searchQuery,
  });
  const { quota } = useDriveQuota();
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

  const handleFileAction = (file: DriveFile, action: "delete" | "rename" | "open") => {
    if (action === "delete") setActiveModal({ type: "delete", file });
    if (action === "rename") setActiveModal({ type: "rename", file });
    if (action === "open" && file.webViewLink) {
      window.open(file.webViewLink, "_blank");
    }
  };

  return (
    <div className={styles.shell}>
      <Sidebar
        currentFolder={currentFolder}
        onFolderChange={(id) => { setCurrentFolder(id); setBreadcrumbs([]); }}
        quota={quota}
        onNewFolder={() => setActiveModal({ type: "newFolder" })}
        onUpload={() => document.getElementById("file-upload-input")?.click()}
      />

      <main className={styles.main}>
        {/* Header Bar */}
        <header className={styles.header}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Cari file atau folder..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              id="search-input"
              aria-label="Cari file"
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={() => setSearchQuery("")} aria-label="Hapus pencarian">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("grid")}
              aria-pressed={viewMode === "grid"}
              title="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              title="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className={styles.content}>
          {/* Breadcrumb */}
          {!searchQuery && (
            <nav className={styles.breadcrumb} aria-label="Folder navigation">
              <button className={styles.breadcrumbItem} onClick={() => handleBreadcrumb(-1)}>
                My Drive
              </button>
              {breadcrumbs.map((crumb, i) => (
                <>
                  <svg key={`sep-${i}`} className={styles.breadcrumbSep} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  <button
                    key={crumb.id}
                    className={`${styles.breadcrumbItem} ${i === breadcrumbs.length - 1 ? styles.breadcrumbCurrent : ""}`}
                    onClick={() => handleBreadcrumb(i)}
                  >
                    {crumb.name}
                  </button>
                </>
              ))}
            </nav>
          )}

          {/* Title */}
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>
              {searchQuery
                ? `Hasil pencarian "${searchQuery}"`
                : breadcrumbs.length > 0
                ? breadcrumbs[breadcrumbs.length - 1].name
                : "My Drive"}
            </h1>
            {!isLoading && (
              <span className={styles.fileCount}>
                {displayFiles.length} item
              </span>
            )}
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
      <input type="file" id="file-upload-input" style={{ display: "none" }} multiple />

      {/* Modals */}
      {activeModal?.type === "newFolder" && (
        <NewFolderModal
          onClose={() => setActiveModal(null)}
          currentFolder={currentFolder}
          onCreated={refetch}
        />
      )}
      {activeModal?.type === "rename" && (
        <RenameModal
          file={activeModal.file}
          onClose={() => setActiveModal(null)}
          onRenamed={refetch}
        />
      )}
      {activeModal?.type === "delete" && (
        <DeleteModal
          file={activeModal.file}
          onClose={() => setActiveModal(null)}
          onDeleted={refetch}
        />
      )}
    </div>
  );
}
