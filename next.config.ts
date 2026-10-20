import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // El límite por defecto de Next.js es 1 MB, insuficiente para imágenes de hasta 5 MB.
      // 6 MB cubre el archivo (≤ 5 MB) más el overhead multipart (~20 KB).
      bodySizeLimit: '6mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
