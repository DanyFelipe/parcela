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

## 4. Correr el proyecto

```bash
pnpm dev                 # http://localhost:3000
```

> Playwright reutiliza un server ya corriendo en `:3000`; sin E2E, el flujo se prueba en
> `http://localhost:3000` manualmente (dashboard → rotar → vista `rear`).

## 5. Comandos de testing (todos)

| Comando                                         | Qué hace                                                            | Requisitos                                    |
| ----------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `pnpm test`                                     | Tests unitarios y de componentes (Vitest) — solo `tests/unit/`      | Ninguno                                       |
| `pnpm exec vitest run tests/unit/X.test.ts`     | Un solo test unitario (reemplazar `X`)                              | Ninguno                                       |
| `pnpm exec vitest`                              | Vitest en modo watch (re-ejecuta al guardar)                        | Ninguno                                       |
| `pnpm test:integration`                         | Smoke tests de integración — `tests/integration/` (Supabase + Blob) | `.env.local` con credenciales reales (opt-in) |
| `pnpm exec playwright test`                     | Tests E2E — solo `tests/e2e/` (lanza su propio `pnpm dev`)          | `.env.local` con credenciales reales          |
| `pnpm exec playwright test tests/e2e/X.spec.ts` | Un solo test E2E (reemplazar `X`)                                   | `.env.local` con credenciales reales          |
| `pnpm exec playwright test --ui`                | Playwright en modo interactivo (elegir tests visualmente)           | `.env.local` con credenciales reales          |
| `pnpm exec playwright show-report`              | Abrir el reporte HTML del último run E2E                            | Haber corrido E2E antes                       |

**Reglas que no se deben mezclar:**

- `pnpm test` (Vitest) **solo descubre `tests/unit/**`** — nunca recoge `tests/e2e/` ni `tests/integration/`.
- Los tests de integración son **opt-in**: no corren con `pnpm test`, solo con `pnpm test:integration`.
- Playwright y Vitest tienen ubicaciones y APIs incompatibles — no mover archivos entre carpetas.

## 6. Quality gates antes de commitear

```bash
pnpm lint                        # ESLint
pnpm exec tsc --noEmit           # typecheck (no hay script dedicado)
pnpm exec prettier --check .     # formato (usa .prettierignore)
pnpm exec prettier --write .     # formato con corrección automática
```

> Husky + lint-staged ejecutan `eslint --fix` y `prettier --write` automáticamente en el
> pre-commit sobre los archivos stageados. **Nunca usar `--no-verify`.**
