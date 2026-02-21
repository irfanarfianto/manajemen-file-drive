import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skripsi Drive — Kelola File Tugas & Skripsi Kamu",
  description:
    "Dashboard modern untuk mengelola file tugas, penelitian, dan skripsi di Google Drive dengan tampilan yang clean dan intuitif.",
};

import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} dark`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
