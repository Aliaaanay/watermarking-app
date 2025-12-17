/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Kita tambahkan ini supaya tidak error jika ada gambar dari luar/lokal
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig