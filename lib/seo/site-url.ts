const HAS_PROTOCOL = /^https?:\/\//i;
const TRAILING_SLASHES = /\/+$/;

function normalizeUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(TRAILING_SLASHES, '');
}

function normalizeVercelHost(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = HAS_PROTOCOL.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(TRAILING_SLASHES, '');
}

/**
 * URL pública absoluta del sitio, necesaria para `metadataBase`, Open Graph,
 * JSON-LD y el sitemap.
 *
 * Prioridad:
 * 1. `NEXT_PUBLIC_SITE_URL` — dominio canónico del cliente (obligatorio en producción).
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — dominio de producción que Vercel expone en el build.
 * 3. `VERCEL_URL` — URL única de ese deployment (útil en Preview).
 *
 * Devuelve `null` si no hay ninguna disponible, para que quien la use degrade en
 * vez de romper el build.
 */
export function getSiteUrl(): string | null {
  return (
    normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeVercelHost(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    normalizeVercelHost(process.env.VERCEL_URL)
  );
}
