"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import styles from "./login.module.css";

// =============================================
// Google SVG Icon
// =============================================
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// =============================================
// Drive Icon
// =============================================
function DriveIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 87.3 78"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L28 48.95H0c0 1.55.4 3.1 1.2 4.5l5.4 13.4z"
        fill="#0066DA"
      />
      <path
        d="M43.65 24.15L29.3 1.2C27.95.4 26.4 0 24.85 0c-1.55 0-3.1.4-4.45 1.2l-14.8 25.35 14.35 24.8 24.6-27.2z"
        fill="#00AC47"
      />
      <path
        d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.3c.8-1.4 1.2-2.95 1.2-4.5H59.3L73.55 76.8z"
        fill="#EA4335"
      />
      <path
        d="M43.65 24.15L57.3 1.2C55.95.4 54.4 0 52.85 0H34.45c-1.55 0-3.1.4-4.45 1.2l14.35 24.8-.7-1.85z"
        fill="#00832D"
      />
      <path
        d="M59.3 48.95H28L13.65 76.8c1.35.8 2.9 1.2 4.45 1.2h50.1c1.55 0 3.1-.4 4.45-1.2L59.3 48.95z"
        fill="#2684FC"
      />
      <path
        d="M73.4 26.55L58.6 1.2C57.25.4 55.7 0 54.15 0h-1.3c1.55 0 3.1.4 4.45 1.2L73.4 26.55z"
        fill="#FFBA00"
      />
      <path
        d="M87.3 52.95c0-1.55-.4-3.1-1.2-4.5l-14.7-25.4-14 24.2 14.15 24.55 15.75-14.85z"
        fill="#FFBA00"
      />
    </svg>
  );
}

// =============================================
// Feature item
// =============================================
function FeatureItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className={styles.featureItem}>
      <span className={styles.featureIcon}>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// =============================================
// Login content (inside Suspense)
// =============================================
function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const error = searchParams.get("error");

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

  const errorMessage =
    error ? (errorMessages[error] ?? errorMessages.Default) : null;

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.logoContainer}>
          <DriveIcon />
        </div>
        <h1 className={styles.title}>Drive Manager</h1>
        <p className={styles.subtitle}>
          Kelola semua file Google Drive kamu dalam satu dashboard yang cepat
          dan modern
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className={styles.errorBanner}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {errorMessage}
        </div>
      )}

      {/* Divider */}
      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>Masuk dengan</span>
        <div className={styles.dividerLine} />
      </div>

      {/* Google Sign-in Button */}
      <button
        className={styles.googleButton}
        onClick={handleGoogleSignIn}
        disabled={loading}
        aria-busy={loading}
        aria-label="Masuk dengan akun Google"
      >
        <span className={styles.googleIconWrapper}>
          {loading ? <span className={styles.spinner} /> : <GoogleIcon />}
        </span>
        <span className={styles.buttonText}>
          {loading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
        </span>
      </button>

      {/* Features */}
      <div className={styles.features}>
        <FeatureItem
          icon={
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          text="Akses semua file & folder Drive"
        />
        <FeatureItem
          icon={
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          text="Upload, download & kelola dengan mudah"
        />
        <FeatureItem
          icon={
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
          text="Aman — akses terbatas sesuai izin OAuth"
        />
      </div>

      {/* Footer */}
      <p className={styles.footerNote}>
        Dengan masuk, kamu menyetujui penggunaan akses Google Drive sesuai
        izin yang diberikan. Data kamu aman dan tidak disimpan di server kami.
      </p>
    </div>
  );
}

// =============================================
// Page Component
// =============================================
export default function LoginPage() {
  return (
    <main className={styles.loginPage}>
      <div className={styles.gridOverlay} aria-hidden="true" />
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
