# SETUP — Puesta en marcha del entorno local

> Referenciado por `docs/ai-context/DEVELOPMENT-PLAN.md` (Sprint 0). Detalle de stack,
> variables de entorno y prohibiciones en `docs/ai-context/01-stack-and-infra.md`.

## 1. Instalar dependencias

```bash
corepack enable          # activa pnpm de packageManager (pnpm@10)
pnpm install
```

## 2. Crear `.env.local` en la raíz

Variables esperadas (nombres exactos en `01-stack-and-infra.md`, sección 4):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage (elegir uno)
STORAGE_PROVIDER=vercel-blob      # o "cloudflare-r2"
BLOB_READ_WRITE_TOKEN=

# Observabilidad / identidad (opcionales en local)
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_CLIENT_SLUG=
```

## 3. Base de datos

1. Crear el proyecto en Supabase.
2. Ejecutar `docs/schema.sql` en el SQL Editor (crea tablas + RLS).
3. Ejecutar `scripts/seed-client.sql` para los datos de prueba (views + view_transitions).

Verificar con el SQL Editor: existen `front`, `rear`, `top` y las 4 transiciones direccionales
(sin `rear↔top`). Los seeds usan `ON CONFLICT DO NOTHING` — son idempotentes.

## 4. Correr y verificar

```bash
pnpm dev                 # http://localhost:3000
pnpm lint
pnpm test                # Vitest unitario (tests/unit)
pnpm test:integration    # opt-in: requiere credenciales reales (tests/integration)
pnpm exec playwright test  # E2E (lanza su propio `pnpm dev`)
```

> Playwright reutiliza un server ya corriendo en `:3000`; sin E2E, el flujo se prueba en
> `http://localhost:3000` manualmente (dashboard → rotar → vista `rear`).
