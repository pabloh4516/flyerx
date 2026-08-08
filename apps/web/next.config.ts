import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilitar cache em rotas de API para garantir dados frescos
  async headers() {
    return [
      {
        // Aplicar a todas as rotas de API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
