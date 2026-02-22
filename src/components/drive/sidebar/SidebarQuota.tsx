"use client";

import { Cloud } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SidebarQuotaProps {
  quota: { limit: number | null; usage: number } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function SidebarQuota({ quota }: SidebarQuotaProps) {
  const usagePercent = quota?.limit ? (quota.usage / quota.limit) * 100 : 0;

  return (
    <div className="p-4 bg-muted/20 border-t mt-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Cloud className="h-4 w-4 text-primary" />
            <span>Penyimpanan</span>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            {usagePercent.toFixed(1)}%
          </span>
        </div>
        <Progress value={usagePercent} className="h-1.5" />
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70 font-medium">
           <span>{quota ? formatBytes(quota.usage) : "0 MB"} terpakai</span>
           <span>{quota?.limit ? formatBytes(quota.limit) : "Tanpa batas"}</span>
        </div>
      </div>
    </div>
  );
}
