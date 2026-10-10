import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde la IP de la red local (p. ej. para probar en celulares).
  // Solo aplica a `next dev`; en producción no tiene efecto.
  allowedDevOrigins: ['192.168.20.23'],
  experimental: {
    serverActions: {
      // Vercel limita el cuerpo de cada función a 4.5 MB; con el overhead de multipart
      // el archivo permitido (4 MB, ver lib/admin/asset-upload.ts) cabe holgado debajo.
      bodySizeLimit: '4.25mb',
    },
  },
  async headers() {
    // El panel /admin no debe quedar en cachés intermedias ni indexarse.
    return [
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

const hasSentryUploadCredentials = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
  sourcemaps: {
    disable: !hasSentryUploadCredentials,
  },
});
