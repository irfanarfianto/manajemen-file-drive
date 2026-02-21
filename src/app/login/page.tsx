"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { 
  AlertCircle, 
  Loader2,
  FileText,
  ShieldCheck,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function DriveIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 87.3 78" fill="none" aria-hidden="true">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z" fill="#0066DA" />
      <path d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z" fill="#00AC47" />
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z" fill="#EA4335" />
      <path d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z" fill="#00832D" />
      <path d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z" fill="#2684FC" />
      <path d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z" fill="#FFBA00" />
    </svg>
  );
}

function FeatureItem({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground group">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <span>{text}</span>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams.get("error");

  // Reset loading state when component mounts or is restored from BFCache (back button)
  useEffect(() => {
    // Handle cases where the browser restores the page from cache without re-mounting
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoading(false);
      }
    };
    
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error("[login] signIn error:", err);
      setLoading(false);
    }
  };

  const errorMessages: Record<string, string> = {
    OAuthCallback: "Terjadi kesalahan saat autentikasi. Coba lagi.",
    OAuthSignin: "Gagal memulai proses login. Periksa konfigurasi OAuth.",
    Callback: "Callback error. Pastikan redirect URI sudah benar.",
    Default: "Terjadi kesalahan. Silakan coba lagi.",
  };

  const errorMessage = error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <Card className="w-full max-w-[440px] border-none shadow-2xl bg-card/60 backdrop-blur-xl relative z-10 overflow-hidden">
      <CardContent className="p-10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-primary/5 mb-6 ring-1 ring-primary/10">
            <DriveIcon />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-3">Skripsi Drive</h1>
          <p className="text-muted-foreground leading-relaxed">
            Kelola semua file tugas dan skripsi kamu dalam satu dashboard yang cepat dan modern
          </p>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-8 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {errorMessage}
          </div>
        )}

        {/* Google Sign-in Button */}
        <div className="space-y-6">
          <Button
            size="lg"
            className="w-full h-14 text-base font-semibold rounded-2xl gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all bg-white text-black hover:bg-slate-50 border border-slate-200"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-muted-foreground font-medium tracking-widest">
                Fitur Dashboard
              </span>
            </div>
          </div>

          {/* Features */}
          <div className="grid gap-4 py-2">
            <FeatureItem icon={Cloud} text="Akses semua file & folder Drive" />
            <FeatureItem icon={FileText} text="Upload & Kelola file dengan mudah" />
            <FeatureItem icon={ShieldCheck} text="Integrasi aman dengan OAuth resmi" />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-muted/50 text-center">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Dengan masuk, kamu menyetujui penggunaan akses Google Drive. 
            Data kamu tetap di Google, sistem ini hanya menyediakan antarmuka.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal border-muted-foreground/20">V1.0 Stable</Badge>
            <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal border-muted-foreground/20">Secured</Badge>
          </div>
        </footer>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 bg-[#030711] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Dynamic grid background */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.2]" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff1a 1px, transparent 0)`,
          backgroundSize: '32px 32px' 
        }}
      />

      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
