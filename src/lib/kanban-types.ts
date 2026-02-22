export interface AttachedFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  webViewLink?: string;
}

export interface Task {
  id: string;
  content: string;
  file?: AttachedFile;
  deadline?: string;
  deadlineType?: "single" | "range";
}

export interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

export interface DriveFilePick {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}
