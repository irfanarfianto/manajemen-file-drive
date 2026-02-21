import { google } from "googleapis";
import type { DriveFile, DriveListOptions, DriveListResult } from "@/lib/drive-types";

// Re-export for convenience (server-side only)
export type { DriveFile, DriveListOptions, DriveListResult } from "@/lib/drive-types";
export { formatFileSize, isFolder, getFileCategory } from "@/lib/drive-types";

const DRIVE_FILE_FIELDS =
  "id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink,starred,trashed,owners,shared,thumbnailLink,properties";


export function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

// =============================================
// LIST FILES
// =============================================
export async function listFiles(
  accessToken: string,
  options: DriveListOptions = {}
): Promise<DriveListResult> {
  const drive = getDriveClient(accessToken);
  const {
    folderId = "root",
    query,
    pageSize = 50,
    pageToken,
    orderBy = "folder,modifiedTime desc",
  } = options;

  let q = `trashed = false and '${folderId}' in parents`;
  if (query) {
    q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
  }

  const response = await drive.files.list({
    q,
    pageSize,
    pageToken,
    orderBy,
    fields: `nextPageToken, files(${DRIVE_FILE_FIELDS})`,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  return {
    files: (response.data.files as DriveFile[]) ?? [],
    nextPageToken: response.data.nextPageToken ?? undefined,
  };
}

// =============================================
// SEARCH FILES (global)
// =============================================
export async function searchFiles(
  accessToken: string,
  query: string,
  pageSize = 30
): Promise<DriveFile[]> {
  const drive = getDriveClient(accessToken);

  const response = await drive.files.list({
    q: `trashed = false and name contains '${query.replace(/'/g, "\\'")}'`,
    pageSize,
    orderBy: "modifiedTime desc",
    fields: `files(${DRIVE_FILE_FIELDS})`,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });

  return (response.data.files as DriveFile[]) ?? [];
}

// =============================================
// GET STORAGE QUOTA
// =============================================
export async function getStorageQuota(accessToken: string) {
  const drive = getDriveClient(accessToken);
  const response = await drive.about.get({
    fields: "storageQuota,user",
  });

  const quota = response.data.storageQuota;
  return {
    limit: quota?.limit ? parseInt(quota.limit) : null,
    usage: quota?.usage ? parseInt(quota.usage) : 0,
    usageInDrive: quota?.usageInDrive ? parseInt(quota.usageInDrive) : 0,
    user: response.data.user,
  };
}

// =============================================
// CREATE FOLDER
// =============================================
export async function createFolder(
  accessToken: string,
  name: string,
  parentId = "root"
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}

// =============================================
// DELETE FILE / FOLDER (move to trash)
// =============================================
export async function deleteFile(
  accessToken: string,
  fileId: string
): Promise<void> {
  const drive = getDriveClient(accessToken);
  await drive.files.update({
    fileId,
    requestBody: { trashed: true },
    supportsAllDrives: true,
  });
}

// =============================================
// RENAME FILE
// =============================================
export async function renameFile(
  accessToken: string,
  fileId: string,
  newName: string
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.update({
    fileId,
    requestBody: { name: newName },
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}

// =============================================
// GET FILE METADATA
// =============================================
export async function getFile(
  accessToken: string,
  fileId: string
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.get({
    fileId,
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}

// =============================================
// UPLOAD FILE (stream)
// =============================================
export async function uploadFile(
  accessToken: string,
  name: string,
  mimeType: string,
  body: NodeJS.ReadableStream,
  parentId = "root"
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
    },
    media: { mimeType, body },
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}

// =============================================
// DOWNLOAD FILE (stream)
// =============================================
export async function downloadFile(
  accessToken: string,
  fileId: string
): Promise<{ data: NodeJS.ReadableStream; mimeType: string }> {
  const drive = getDriveClient(accessToken);
  const file = await drive.files.get({
    fileId,
    fields: "mimeType",
    supportsAllDrives: true,
  });

  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  return {
    data: response.data as NodeJS.ReadableStream,
    mimeType: file.data.mimeType || "application/octet-stream",
  };
}

// =============================================
// UPDATE PROPERTIES (TAGS)
// =============================================
export async function updateFileProperties(
  accessToken: string,
  fileId: string,
  properties: Record<string, string | null>
): Promise<DriveFile> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.update({
    fileId,
    requestBody: { properties: properties as Record<string, string> },
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}

// =============================================
// EXPORT GOOGLE DOCUMENT (to PDF/Text)
// =============================================
export async function exportFile(
  accessToken: string,
  fileId: string,
  mimeType = "application/pdf"
): Promise<NodeJS.ReadableStream> {
  const drive = getDriveClient(accessToken);
  const response = await drive.files.export(
    { fileId, mimeType },
    { responseType: "stream" }
  );
  return response.data as NodeJS.ReadableStream;
}

// =============================================
// BATCH DELETE FILES
// =============================================
export async function batchDeleteFiles(
  accessToken: string,
  fileIds: string[]
): Promise<void> {
  const drive = getDriveClient(accessToken);
  
  // Google Drive API does not have a native bulk delete endpoint in v3,
  // so we execute them concurrently.
  await Promise.all(
    fileIds.map((fileId) => 
      drive.files.delete({ fileId, supportsAllDrives: true })
        .catch(err => {
          console.error(`Failed to delete file ${fileId}:`, err);
          // Don't throw here so we attempt to delete the rest
        })
    )
  );
}

// =============================================
// GET FILE REVISIONS
// =============================================
export async function getRevisions(
  accessToken: string,
  fileId: string
): Promise<import("googleapis").drive_v3.Schema$Revision[]> {
  const drive = getDriveClient(accessToken);
  const response = await drive.revisions.list({
    fileId,
    fields: "revisions(id,modifiedTime,originalFilename,size,lastModifyingUser,published)",
  });
  return response.data.revisions || [];
}

// =============================================
// APP FOLDER — semua data app disimpan di sini
// =============================================
export const APP_FOLDER_NAME = "DriveManager Data [Jangan dihapus]";

/**
 * Cari atau buat folder khusus aplikasi di root Drive.
 * Semua file JSON data (Kanban, catatan revisi, dll) tersimpan di sini.
 */
export async function getOrCreateAppFolder(accessToken: string): Promise<string> {
  const drive = getDriveClient(accessToken);

  // Cari folder yang sudah ada
  const search = await drive.files.list({
    q: `name = '${APP_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and 'root' in parents and trashed = false`,
    fields: "files(id)",
  });

  if (search.data.files && search.data.files.length > 0) {
    return search.data.files[0].id!;
  }

  // Buat folder baru
  const folder = await drive.files.create({
    requestBody: {
      name: APP_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      parents: ["root"],
    },
    fields: "id",
  });

  return folder.data.id!;
}

// ──────────────────────────────────────────────
// Helper: baca file JSON dari app folder
// ──────────────────────────────────────────────
async function readAppJson<T>(
  accessToken: string,
  fileName: string,
  defaultValue: T
): Promise<T> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);

  const search = await drive.files.list({
    q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
    fields: "files(id)",
  });

  const files = search.data.files;
  if (!files || files.length === 0) return defaultValue;

  const fileRes = await drive.files.get(
    { fileId: files[0].id!, alt: "media" },
    { responseType: "text" }
  );
  return (typeof fileRes.data === "string" ? JSON.parse(fileRes.data) : fileRes.data) as T;
}

// ──────────────────────────────────────────────
// Helper: simpan file JSON ke app folder
// ──────────────────────────────────────────────
async function writeAppJson<T>(
  accessToken: string,
  fileName: string,
  data: T
): Promise<void> {
  const drive = getDriveClient(accessToken);
  const folderId = await getOrCreateAppFolder(accessToken);

  const search = await drive.files.list({
    q: `name = '${fileName}' and '${folderId}' in parents and trashed = false`,
    fields: "files(id)",
  });

  const media = { mimeType: "application/json", body: JSON.stringify(data) };
  const files = search.data.files;

  if (!files || files.length === 0) {
    await drive.files.create({
      requestBody: { name: fileName, parents: [folderId] },
      media,
      fields: "id",
    });
  } else {
    await drive.files.update({ fileId: files[0].id!, media });
  }
}

// =============================================
// KANBAN DATA
// =============================================
export const KANBAN_FILE_NAME = "kanban.json";

export async function getKanbanData(accessToken: string) {
  return readAppJson(accessToken, KANBAN_FILE_NAME, {
    columns: [
      { id: "todo", title: "To Do", tasks: [] },
      { id: "doing", title: "In Progress", tasks: [] },
      { id: "done", title: "Done", tasks: [] },
    ],
  });
}

export async function saveKanbanData(accessToken: string, data: unknown) {
  return writeAppJson(accessToken, KANBAN_FILE_NAME, data);
}

// =============================================
// FILE REVISION NOTES (Per-File Checklist)
// =============================================
export const FILE_NOTES_NAME = "file-notes.json";

export async function getFileNotes(accessToken: string) {
  return readAppJson(accessToken, FILE_NOTES_NAME, { files: {} });
}

export async function saveFileNotes(accessToken: string, data: unknown) {
  return writeAppJson(accessToken, FILE_NOTES_NAME, data);
}



