// next.config.ts
import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
// Extraire la base URL (supprimer /api/v1 du chemin)
const API_BASE_URL = API_URL.replace('/api/v1', '');

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '172.24.224.1',
    '10.17.7.229',
    '*.local',
    'localhost',
    '192.168.*.*',
    '10.*.*.*'
  ],

  async rewrites() {
    return [
      // Proxy pour l'API backend - utilise la variable d'env
      {
        source: '/api/:path*',
        destination: `${API_BASE_URL}/api/:path*`,
      },
      // Proxy pour les uploads
      {
        source: '/uploads/:path*',
        destination: `${API_BASE_URL}/uploads/:path*`,
      },
    ];
  },
  
  // Désactiver l'optimisation d'image
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
