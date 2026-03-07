// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ✅ AJOUTEZ CETTE CONFIGURATION POUR LE RÉSEAU LOCAL
  allowedDevOrigins: [
    '172.24.224.1',        // Votre IP réseau actuelle
    '10.17.7.229',         // IP de votre smartphone (d'après le log)
    '*.local',             // Pour les domaines .local
    'localhost',           // Toujours garder localhost
    '192.168.*.*',         // Plage IP courante
    '10.*.*.*'             // Plage IP courante
  ],

  async rewrites() {
    return [
      // Proxy pour l'API backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
        //destination: 'http://172.31.96.1:8000/api/:path*',
      },
      // PROXY POUR LES IMAGES (C'EST CE QUI MANQUE !)
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:8000/uploads/:path*',
        //destination: 'http://172.31.96.1:8000/uploads/:path*',
      },
    ];
  },
  // Désactiver l'optimisation d'image pour éviter les problèmes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
