"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  HardDrive,
  SquareKanban,
  LogOut,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function PreviewSidebar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen overflow-hidden flex-shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z" fill="#0066DA" />
            <path d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z" fill="#00AC47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z" fill="#EA4335" />
            <path d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z" fill="#00832D" />
            <path d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z" fill="#2684FC" />
            <path d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z" fill="#FFBA00" />
          </svg>
        </div>
        <span className="font-bold text-lg tracking-tight">Drive Manager</span>
      </div>

      {/* Back button */}
      <div className="px-4 mb-3">
        <Button
          variant="secondary"
          className="w-full justify-start gap-2 bg-secondary/50 hover:bg-secondary"
          onClick={() => router.push("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Button>
      </div>

      <Separator className="mx-4 w-auto mb-4" />

      {/* Nav */}
      <nav className="px-3 space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3"
          onClick={() => router.push("/dashboard")}
        >
          <span className="p-1 rounded-md text-muted-foreground">
            <HardDrive className="h-4 w-4" />
          </span>
          <span className="font-medium">My Drive</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3"
          onClick={() => router.push("/dashboard?view=kanban")}
        >
          <span className="p-1 rounded-md text-muted-foreground">
            <SquareKanban className="h-4 w-4" />
          </span>
          <span className="font-medium">Kanban Tugas</span>
        </Button>
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User */}
      <div className="p-4 bg-muted/30 border-t mt-auto">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={session?.user?.image ?? ""} />
            <AvatarFallback>{session?.user?.name?.charAt(0) ?? "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate leading-none mb-1">
              {session?.user?.name}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {session?.user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
            disabled={signingOut}
            title="Sign out"
          >
            {signingOut
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <LogOut className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex">
        <PreviewSidebar />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
