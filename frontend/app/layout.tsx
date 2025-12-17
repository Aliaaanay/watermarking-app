import type { Metadata } from "next";
import { Inter } from "next/font/google";

// --- PERBAIKAN DI SINI (Pakai 's') ---
import "./globals.css";

import { Providers } from "./providers";

// Setup font google
const inter = Inter({ subsets: ["latin"] });

// 2. METADATA YANG LEBIH KEREN
export const metadata: Metadata = {
  title: "Ultimate Watermark Pro",
  description: "Secure your images with professional Text & Logo watermarking.",
  icons: {
    icon: "/favicon.ico", // Opsional jika punya icon
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {/* Struktur Layout:
            1. Navbar (Atas)
            2. Konten Utama (Tengah/Children)
            3. Footer (Bawah)
          */}

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            {/* --- NAVBAR SEDERHANA --- */}
            <header
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid var(--border)",
                backgroundColor: "var(--card-bg)",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "var(--primary)",
                  letterSpacing: "1px",
                }}
              >
                WATERMARK{" "}
                <span style={{ color: "var(--foreground)" }}>APP</span>
              </h1>
            </header>

            {/* --- KONTEN UTAMA (Page.tsx masuk sini) --- */}
            <main style={{ flex: 1 }}>{children}</main>

            {/* --- FOOTER --- */}
            <footer
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "#718096",
                fontSize: "0.875rem",
                borderTop: "1px solid var(--border)",
                backgroundColor: "var(--card-bg)",
              }}
            >
              <p>
                © 2025 Digital Image Processing Project. Created by{" "}
                <b>Afriza</b>.
              </p>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
