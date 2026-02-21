"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";

// ─── Sidebar wrapper ──────────────────────────────────────────────────────
import { Sidebar } from "@/components/drive/Sidebar";
import { useDriveQuota } from "@/hooks/useDrive";

// ─── Sidebar Wrapper ──────────────────────────────────────────────────────
function SidebarWrapper() {
  const router = useRouter();
  const params = useSearchParams();
  const fileId = params.get("fileId") ?? "";
  const { quota } = useDriveQuota();

  const handleFolderChange = (folderId: string) => {
    router.push(`/dashboard?folderId=${folderId}`);
  };

  const redirectToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <Sidebar
      currentFolder={fileId}
      onFolderChange={handleFolderChange}
      quota={quota}
      onNewFolder={redirectToDashboard}
      onUpload={redirectToDashboard}
      onThesisTemplate={redirectToDashboard}
    />
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Suspense fallback={
          <aside className="w-64 border-r bg-card flex items-center justify-center h-screen">
            <Loader2 className="h-5 w-5 animate-spin text-primary/40" />
          </aside>
        }>
          <SidebarWrapper />
        </Suspense>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

