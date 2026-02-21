"use client";

import { useState } from "react";
import styles from "./FileGrid.module.css";
import { FileIcon } from "@/components/ui/FileIcon";
import {
  formatFileSize,
  isFolder,
  type DriveFile,
} from "@/lib/drive-types";

interface FileGridProps {
  files: DriveFile[];
  loading: boolean;
  error: string | null;
  viewMode: "grid" | "list";
  onFolderOpen: (folderId: string, folderName: string) => void;
  onFileAction: (file: DriveFile, action: "delete" | "rename" | "open") => void;
}

function SkeletonCard({ mode }: { mode: "grid" | "list" }) {
  if (mode === "list") {
    return (
      <div className={styles.skeletonRow}>
        <div className={styles.skeletonIcon} />
        <div className={styles.skeletonText} style={{ width: "40%" }} />
        <div className={styles.skeletonText} style={{ width: "15%" }} />
        <div className={styles.skeletonText} style={{ width: "20%" }} />
      </div>
    );
  }
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonCardIcon} />
      <div className={styles.skeletonText} style={{ width: "70%", marginTop: 8 }} />
      <div className={styles.skeletonText} style={{ width: "40%", marginTop: 4 }} />
    </div>
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

interface FileCardProps {
  file: DriveFile;
  viewMode: "grid" | "list";
  onOpen: () => void;
  onAction: (action: "delete" | "rename" | "open") => void;
}

function FileCard({ file, viewMode, onOpen, onAction }: FileCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const folder = isFolder(file.mimeType);

  const handleClick = (e: React.MouseEvent) => {
    if (folder) {
      e.preventDefault();
      onOpen();
    } else if (file.webViewLink) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
    }
  };

  if (viewMode === "list") {
    return (
      <div
        className={styles.listRow}
        onClick={handleClick}
        tabIndex={0}
        role="button"
        aria-label={`Buka ${file.name}`}
        onKeyDown={(e) => e.key === "Enter" && handleClick(e as never)}
      >
        <span className={styles.listIcon}>
          <FileIcon mimeType={file.mimeType} size={20} />
        </span>
        <span className={styles.listName}>{file.name}</span>
        <span className={styles.listSize}>{formatFileSize(file.size)}</span>
        <span className={styles.listDate}>{formatDate(file.modifiedTime)}</span>

        <div className={styles.listActions}>
          {file.webViewLink && !folder && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtn}
              onClick={(e) => e.stopPropagation()}
              title="Buka di Google Drive"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <div className={styles.menuWrapper}>
            <button
              className={styles.actionBtn}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              title="More options"
              aria-label="More options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
              </svg>
            </button>
            {menuOpen && (
              <div className={styles.menu} onMouseLeave={() => setMenuOpen(false)}>
                <button className={styles.menuItem} onClick={() => { onAction("rename"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
                <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onAction("delete"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.gridCard} ${folder ? styles.folderCard : ""}`}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`Buka ${file.name}`}
      onKeyDown={(e) => e.key === "Enter" && handleClick(e as never)}
    >
      <div className={styles.cardHeader}>
        <FileIcon mimeType={file.mimeType} size={32} />
        <div className={styles.cardMenu}>
          <div className={styles.menuWrapper}>
            <button
              className={styles.cardMenuBtn}
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              aria-label="More options"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />
              </svg>
            </button>
            {menuOpen && (
              <div className={`${styles.menu} ${styles.menuLeft}`} onMouseLeave={() => setMenuOpen(false)}>
                {file.webViewLink && !folder && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.menuItem}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Buka
                  </a>
                )}
                <button className={styles.menuItem} onClick={() => { onAction("rename"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
                <button className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { onAction("delete"); setMenuOpen(false); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <p className={styles.cardName} title={file.name}>{file.name}</p>
        <p className={styles.cardMeta}>
          {folder ? "Folder" : formatFileSize(file.size)} · {formatDate(file.modifiedTime)}
        </p>
      </div>
    </div>
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
      <div className={viewMode === "grid" ? styles.grid : styles.list}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} mode={viewMode} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>⚠️</div>
        <p className={styles.emptyTitle}>Gagal memuat file</p>
        <p className={styles.emptyText}>{error}</p>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.3">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p className={styles.emptyTitle}>Folder kosong</p>
        <p className={styles.emptyText}>Belum ada file di sini. Upload atau buat folder baru.</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className={styles.list}>
        <div className={styles.listHeader}>
          <span className={styles.listHeaderIcon} />
          <span className={styles.listHeaderName}>Nama</span>
          <span className={styles.listHeaderSize}>Ukuran</span>
          <span className={styles.listHeaderDate}>Diubah</span>
          <span className={styles.listHeaderActions} />
        </div>
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            viewMode="list"
            onOpen={() => onFolderOpen(file.id, file.name)}
            onAction={(action) => onFileAction(file, action)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          viewMode="grid"
          onOpen={() => onFolderOpen(file.id, file.name)}
          onAction={(action) => onFileAction(file, action)}
        />
      ))}
    </div>
  );
}
