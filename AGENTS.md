<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Proyecto

Plantilla de showroom inmobiliario inmersivo (loteos/terrenos): renders de D5 retocados en Photoshop, transiciones entre vistas generadas por IA como video real. Producto multi-cliente: cada inmobiliaria se despliega por separado (Vercel + Supabase propios).

**Antes de escribir código, lee `docs/ai-context/00-INDEX.md`** — dirige a los documentos específicos según la tarea (stack, arquitectura, base de datos, estándares de código, design system). No asumas convenciones genéricas de tu entrenamiento cuando este proyecto ya las define explícitamente ahí.

## Stack

Next.js 14+ (App Router) · TypeScript estricto · Tailwind + shadcn/ui · Supabase (Postgres + Auth) · Zustand · Zod · pnpm.

## Comandos

```bash
pnpm dev          # servidor de desarrollo
pnpm lint         # ESLint
pnpm test         # Vitest (unitario)
pnpm exec playwright test   # E2E
```

## Reglas no negociables (detalle completo en docs/ai-context/)

- Todo identificador de código en inglés; contenido de negocio/UI en español.
- Todo acceso a storage pasa por la interfaz `StorageProvider` — nunca el SDK del proveedor directo.
- Toda escritura a Supabase pasa por una Server Action con validación Zod — nunca desde un componente cliente.
- RLS nunca se desactiva. El tema visual es fijo (sin modo oscuro, sin selector) — ver `05-design-system.md`.
- Fase actual: carga de datos manual por SQL, sin CRUD en `/admin` todavía — no lo construyas sin que se pida explícitamente (ver `02-architecture.md`, sección 0).
- Ante cualquier ambigüedad, pregunta antes de asumir.

## Dónde está todo

Ver `docs/ai-context/00-INDEX.md` para el mapa completo de documentación por tema.
