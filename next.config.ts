import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde la IP de la red local (p. ej. para probar en celulares).
  // Solo aplica a `next dev`; en producción no tiene efecto.
  allowedDevOrigins: ['192.168.20.23'],
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
