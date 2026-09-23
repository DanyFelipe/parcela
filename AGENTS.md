<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Proyecto

Plantilla de showroom inmobiliario inmersivo (loteos/terrenos): renders de D5 retocados en Photoshop, transiciones entre vistas como clips de video reales — cada dirección de transición es un clip independiente, nunca se reproduce un video en reversa. Producto multi-cliente: cada inmobiliaria se despliega por separado (Vercel + Supabase propios), mismo código diferenciado solo por variables de entorno y datos.

**Antes de escribir código, lee `docs/ai-context/00-INDEX.md`** — dirige a los documentos específicos según la tarea (stack, arquitectura, base de datos, estándares de código). No asumas convenciones genéricas de tu entrenamiento cuando este proyecto ya las define explícitamente ahí. Si el chat contradice un documento de `docs/ai-context/`, señala el conflicto y pide confirmación — no decidas por tu cuenta que lo último gana. Tampoco reescribas esos documentos de forma autónoma: solo propón el cambio.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript estricto · Tailwind v4 + shadcn/ui · Supabase (Postgres + Auth) · Zustand · Zod 4 · pnpm.

- La versión de Next.js es más nueva que tus datos de entrenamiento — lee las guías en `node_modules/next/dist/docs/` antes de escribir código Next (ver bloque generado arriba).
- No instales librerías nuevas ni cambies proveedores de infra sin confirmación explícita (lista oficial y prohibiciones en `01-stack-and-infra.md`).

## Comandos

```bash
pnpm dev                                  # servidor de desarrollo (:3000)
pnpm lint                                 # ESLint
pnpm test                                 # Vitest — SOLO descubre tests/unit/**/*.test.{ts,tsx}
pnpm test:integration                     # integración opt-in — SOLO tests/integration/ (requiere .env.local)
pnpm exec playwright test                 # E2E — SOLO tests/e2e/
pnpm exec vitest run tests/unit/X.test.ts # un solo test unitario
pnpm exec tsc --noEmit                    # no hay script de typecheck dedicado
```

- Playwright arranca su propio `pnpm dev` en `:3000` (reutiliza uno ya corriendo en local) y **requiere `.env.local`** con las variables de Supabase.
- Vitest y Playwright tienen ubicaciones y APIs incompatibles — no mezclar tests entre `tests/unit/` y `tests/e2e/`.

## Convenciones del repo

- Alias `@/*` apunta a la **raíz del repo** (no existe `src/`).
- Pre-commit (Husky + lint-staged): `eslint --fix` + `prettier --write` sobre lo stageado. Nunca sugerir `--no-verify`.
- Commits: Conventional Commits con scope de ticket — `feat(PARC-109): ...` (ver `git log`).
- Prettier: comillas simples, `printWidth` 100.

## Reglas no negociables (detalle completo en docs/ai-context/)

- Todo identificador de código en inglés; contenido de negocio/UI en español.
- Todo acceso a storage pasa por la interfaz `StorageProvider` (`lib/storage/`) — nunca el SDK del proveedor directo.
- Toda escritura a Supabase pasa por una Server Action con validación Zod — nunca desde un componente cliente. La `service_role key` vive solo en el servidor.
- RLS nunca se desactiva. El tema visual es fijo (sin modo oscuro, sin selector).
- Para cualquier tarea de diseño visual (UI, colores, tipografía, animación) se usan **solo 2 fuentes**: `shadcn/ui` estándar + la skill `frontend-design`. No existe un design system propio en el repo — ver `docs/ai-context/00-INDEX.md`.
- Auth existe solo para `/admin`; el visitante del showroom nunca inicia sesión ni tiene cuenta. El `matcher` del middleware no se amplía fuera de `/admin/:path*`.
- Sin lógica condicional por cliente (`if (cliente === 'x')`) en la plantilla — las diferencias entre clientes viven en datos y env vars.
- Fase actual: carga de datos manual por SQL, sin CRUD en `/admin` todavía — no lo construyas sin que se pida explícitamente (ver `02-architecture.md`, sección 0). Definir el schema Zod y las políticas RLS sí corresponde desde ya.
- Ante cualquier ambigüedad, pregunta antes de asumir.

## Dónde está todo

Ver `docs/ai-context/00-INDEX.md` para el mapa completo de documentación por tema. El esquema real de la base de datos está en `docs/schema.sql`.
