"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";

// --- 1. KONFIGURASI TEMA CUSTOM ---
const theme = extendTheme({
  // Paksa aplikasi mulai di Dark Mode
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  // Daftarkan warna custom (Netflix Red)
  colors: {
    brand: {
      500: "#E50914", // Merah Netflix Utama
      600: "#B2070F", // Merah Gelap (Hover)
    },
    // Override warna abu-abu default Chakra supaya lebih pekat (OLED style)
    gray: {
      900: "#050505", // Background Halaman
      800: "#141414", // Background Card/Panel
      700: "#2d2d2d",
    },
  },
  // Style Global (memastikan background tidak flash putih saat loading)
  styles: {
    global: {
      body: {
        bg: "gray.900",
        color: "white",
      },
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      {/* Masukkan theme custom ke ChakraProvider */}
      <ChakraProvider theme={theme}>{children}</ChakraProvider>
    </CacheProvider>
  );
}
