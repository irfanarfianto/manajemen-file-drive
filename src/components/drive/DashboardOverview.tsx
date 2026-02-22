"use client";

import { useSession } from "next-auth/react";
import { 
  Cloud, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Folder, 
  Plus, 
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  HardDrive,
  BarChart3
} from "lucide-react";
import { FileIcon } from "@/components/ui/FileIcon";
import { useDriveQuota, useDriveFiles } from "@/hooks/useDrive";
import { useKanban } from "@/hooks/useKanban";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatFileSize, getFileCategory, type DriveFile } from "@/lib/drive-types";
import { cn } from "@/lib/utils";

interface DashboardOverviewProps {
  onFolderOpen: (id: string, name: string) => void;
  onKanbanOpen: () => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onViewFile: (file: DriveFile) => void;
}

export function DashboardOverview({ 
  onFolderOpen, 
  onKanbanOpen, 
  onNewFolder, 
  onUpload,
  onViewFile
}: DashboardOverviewProps) {
  const { data: session } = useSession();
  const { quota, loading: quotaLoading } = useDriveQuota();
  const { data: kanbanData, loading: kanbanLoading } = useKanban();
  
  // Ambil file terbaru secara global
  const { files: recentFiles, loading: recentLoading } = useDriveFiles({
    enabled: true,
    orderBy: "modifiedTime desc"
  });

  // Ambil file terbesar secara global (berdasarkan kuota yang digunakan)
  const { files: largestFiles, loading: largestLoading } = useDriveFiles({
    enabled: true,
    orderBy: "quotaBytesUsed desc"
  });

  const storageUsagePercent = quota?.limit 
    ? (quota.usage / quota.limit) * 100 
    : 0;

  const kanbanSummary = kanbanData?.columns.map(col => ({
    title: col.title,
    count: col.tasks.length,
    id: col.id
  })) || [];

  const totalTasks = kanbanSummary.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Greeting & Quick Stats */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Halo, {session?.user?.name?.split(" ")[0] || "Mahasiswa"}! 👋
            </h1>
            <p className="text-muted-foreground">
              Siap buat progres kuliah kamu hari ini? Semangat ya!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onUpload} className="rounded-xl shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4 mr-2" />
              Upload Tugas
            </Button>
            <Button variant="outline" onClick={onNewFolder} className="rounded-xl">
              <Folder className="h-4 w-4 mr-2" />
              Folder Baru
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Storage Card */}
          <Card className="rounded-3xl border-none bg-gradient-to-br from-primary/10 via-background to-background shadow-xl shadow-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Cloud className="h-4 w-4 text-primary" />
                Penyimpanan Drive
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotaLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold">{formatFileSize(quota?.usage ?? 0)}</span>
                    <span className="text-xs text-muted-foreground">
                      dari {formatFileSize(quota?.limit ?? 0)}
                    </span>
                  </div>
                  <Progress value={storageUsagePercent} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {storageUsagePercent.toFixed(1)}% terpakai
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kanban Stats Card */}
          <Card className="rounded-3xl border-none bg-gradient-to-br from-orange-500/10 via-background to-background shadow-xl shadow-orange-500/5 col-span-1 md:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-orange-500" />
                  Ringkasan Kanban
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onKanbanOpen} className="h-8 text-xs gap-1 group">
                  Buka Board <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {kanbanLoading ? (
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                  <Skeleton className="h-16 w-full rounded-2xl" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {kanbanSummary.map((col) => (
                    <div key={col.id} className="bg-muted/40 p-4 rounded-2xl">
                      <p className="text-xs text-muted-foreground mb-1">{col.title}</p>
                      <p className="text-2xl font-bold">{col.count}</p>
                    </div>
                  ))}
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <p className="text-xs text-primary/70 mb-1">Total Tugas</p>
                    <p className="text-2xl font-bold text-primary">{totalTasks}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Files & Largest Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Files */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              File Terbaru
            </h2>
          </div>
          
          <Card className="rounded-3xl overflow-hidden border-muted/40 shadow-sm border-none bg-card/60 backdrop-blur-sm">
            <CardContent className="p-0">
              {recentLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentFiles.length > 0 ? (
                <div className="divide-y divide-muted/20">
                  {recentFiles.slice(0, 5).map((file) => (
                    <button
                      key={file.id}
                      onClick={() => onViewFile(file)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group"
                    >
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                        <FileIcon mimeType={file.mimeType} size={32} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{file.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-all mr-2" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-muted-foreground">
                  Belum ada file terbaru.
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Largest Items */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rose-500" />
              Item Terbesar
            </h2>
          </div>
          
          <Card className="rounded-3xl overflow-hidden border-muted/40 shadow-sm border-none bg-card/60 backdrop-blur-sm">
            <CardContent className="p-0">
              {largestLoading ? (
                <div className="p-4 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-muted/20">
                  {largestFiles
                    .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
                    .slice(0, 5)
                    .map((file) => (
                      <button
                        key={file.id}
                        onClick={() => onViewFile(file)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left group"
                      >
                        <div className="h-10 w-10 shrink-0 flex items-center justify-center">
                          <FileIcon mimeType={file.mimeType} size={32} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate group-hover:text-rose-600 transition-colors">{file.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md font-bold">
                              {formatFileSize(file.size)}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">
                              {getFileCategory(file.mimeType)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-rose-600 transition-all mr-2" />
                      </button>
                    ))}
                  {largestFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').length === 0 && !largestLoading && (
                    <div className="p-10 text-center text-muted-foreground text-sm italic">
                      Tidak ada data ukuran file tersedia.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Insights Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Wawasan Tugas
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-3xl bg-green-500/5 border-none shadow-sm overflow-hidden relative">
            <CardContent className="p-6 flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-600 shadow-lg shadow-green-500/10">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-bold text-green-700">Pencapaian Kamu</p>
                <p className="text-sm text-green-600/80">
                  Luar biasa! Kamu sudah menyelesaikan **{kanbanSummary.find(c => c.id === 'done')?.count || 0} tugas** sejauh ini.
                </p>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-500/10 rounded-full blur-2xl"></div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-none bg-muted/30 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Tips Produktivitas
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground leading-relaxed pr-8">
              Gunakan fitur **Kanban** untuk membagi satu tugas besar (seperti Skripsi) menjadi langkah-langkah kecil. Ini terbukti mengurangi rasa cemas saat ngerjain tugas akhir!
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
