"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  currentFolder: string;
  onFolderChange: (folderId: string) => void;
  quota: { limit: number | null; usage: number } | null;
  onNewFolder: () => void;
  onUpload: () => void;
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
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <svg width="20" height="20" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z" fill="#0066DA" />
            <path d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z" fill="#00AC47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z" fill="#EA4335" />
            <path d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z" fill="#00832D" />
            <path d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z" fill="#2684FC" />
            <path d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z" fill="#FFBA00" />
          </svg>
        </div>
        <span className={styles.logoText}>Drive Manager</span>
      </div>

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button className={styles.btnUpload} onClick={onUpload} id="sidebar-upload-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload File
        </button>
        <button className={styles.btnNewFolder} onClick={onNewFolder} id="sidebar-new-folder-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
          Folder Baru
        </button>
      </div>

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Drive navigation">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.navItem} ${currentFolder === item.id ? styles.navItemActive : ""}`}
            onClick={() => onFolderChange(item.id)}
            id={`nav-${item.id}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.spacer} />

      {/* Storage Quota */}
      {quota && (
        <div className={styles.quota}>
          <div className={styles.quotaHeader}>
            <span className={styles.quotaLabel}>Penyimpanan</span>
            <span className={styles.quotaValue}>
              {formatBytes(quota.usage)}
              {quota.limit ? ` / ${formatBytes(quota.limit)}` : ""}
            </span>
          </div>
          <div className={styles.quotaBar} role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={styles.quotaFill}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
          <p className={styles.quotaPercent}>{usagePercent.toFixed(1)}% terpakai</p>
        </div>
      )}

      {/* User Profile */}
      <div className={styles.profile}>
        {session?.user?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt={session.user.name ?? "User"}
            className={styles.avatar}
            referrerPolicy="no-referrer"
          />
        )}
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{session?.user?.name}</p>
          <p className={styles.profileEmail}>{session?.user?.email}</p>
        </div>
        <button
          className={styles.signOutBtn}
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          aria-label="Sign out"
        >
          {signingOut ? (
            <span className={styles.spinnerSm} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
