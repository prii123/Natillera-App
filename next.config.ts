import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    // Solo aplicar headers restrictivos en producción
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/((?!login|auth).*)',
          headers: [
            {
              key: 'Cross-Origin-Opener-Policy',
              value: 'same-origin-allow-popups'
            },
            {
              key: 'Cross-Origin-Embedder-Policy',
              value: 'credentialless'
            }
          ]
        }
      ];
    }

    // En desarrollo, no aplicar headers restrictivos
    return [];
  }
};

export default nextConfig;
