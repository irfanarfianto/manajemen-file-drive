// =============================================
// Drive file type definitions (safe for client import)
// =============================================
export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  createdTime?: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  starred?: boolean;
  trashed?: boolean;
  owners?: Array<{ displayName: string; photoLink?: string }>;
  shared?: boolean;
  thumbnailLink?: string;
}

export interface DriveListOptions {
  folderId?: string;
  query?: string;
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}

export interface DriveListResult {
  files: DriveFile[];
  nextPageToken?: string;
}

// =============================================
// Pure helper functions (no Node.js deps)
// =============================================
export function formatFileSize(bytes?: string | number): string {
  const n = typeof bytes === "string" ? parseInt(bytes) : (bytes ?? 0);
  if (!n) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = n;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function isFolder(mimeType: string): boolean {
  return mimeType === "application/vnd.google-apps.folder";
}

export function getFileCategory(mimeType: string): string {
  if (isFolder(mimeType)) return "folder";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType.includes("pdf")) return "pdf";
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  )
    return "spreadsheet";
  if (
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("text")
  )
    return "document";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint"))
    return "presentation";
  if (mimeType.includes("zip") || mimeType.includes("compressed"))
    return "archive";
  if (
    mimeType.includes("code") ||
    mimeType.includes("javascript") ||
    mimeType.includes("json")
  )
    return "code";
  return "file";
}
