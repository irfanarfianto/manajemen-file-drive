import { google } from "googleapis";
import type { DriveFile, DriveListOptions, DriveListResult } from "@/lib/drive-types";

// Re-export for convenience (server-side only)
export type { DriveFile, DriveListOptions, DriveListResult } from "@/lib/drive-types";
export { formatFileSize, isFolder, getFileCategory } from "@/lib/drive-types";

const DRIVE_FILE_FIELDS =
  "id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink,starred,trashed,owners,shared,thumbnailLink,properties";


function getDriveClient(accessToken: string) {
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
    requestBody: { properties: properties as any },
    fields: DRIVE_FILE_FIELDS,
    supportsAllDrives: true,
  });
  return response.data as DriveFile;
}


