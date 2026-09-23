import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Tests de integración: opt-in, se ejecutan SOLO con `pnpm test:integration`.
// Conectan contra servicios reales (Supabase, Vercel Blob/R2) y por lo tanto
// requieren credenciales reales en `.env.local` — se cargan aquí al arrancar.
// Convenciones completas en `tests/integration/README.md` y en la
// "Estrategia única de verificación externa" de `docs/ai-context/DEVELOPMENT-PLAN.md`.
const envPath = path.resolve(__dirname, '.env.local');
if (existsSync(envPath)) {
  loadEnvFile(envPath);
}

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts', 'tests/integration/**/*.test.tsx'],
  },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
