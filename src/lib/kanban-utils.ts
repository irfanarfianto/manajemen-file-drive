import { AttachedFile } from "./kanban-types";

export const OFFICE_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
]);

export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  if (dateStr.includes(" - ")) {
    return dateStr.split(" - ").map(d => {
      try {
        const dt = new Date(d);
        return dt.toLocaleDateString("id-ID", { day: 'numeric', month: 'short' });
      } catch { return d; }
    }).join(" - ");
  }
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function openFile(f: AttachedFile) {
  if (OFFICE_TYPES.has(f.mimeType) && f.webViewLink) {
    window.open(f.webViewLink, "_blank", "noopener,noreferrer");
  } else {
    const params = new URLSearchParams({ 
      fileId: f.fileId, 
      fileName: f.fileName, 
      mimeType: f.mimeType, 
      webViewLink: f.webViewLink || "" 
    });
    window.open(`/dashboard/preview?${params}`, "_blank");
  }
}
