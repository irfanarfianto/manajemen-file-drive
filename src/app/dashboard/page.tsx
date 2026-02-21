import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <div
        style={{
          padding: "32px",
          background: "var(--glass-bg)",
          border: "1px solid var(--glass-border)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          textAlign: "center",
          maxWidth: "480px",
        }}
      >
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
          ✅ Login berhasil!
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "8px" }}>
          Selamat datang, {session.user?.name?.split(" ")[0]}!
        </h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", marginBottom: "24px" }}>
          {session.user?.email}
        </p>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
          🚀 Dashboard lengkap sedang dibangun...
        </p>
      </div>
    </main>
  );
}
