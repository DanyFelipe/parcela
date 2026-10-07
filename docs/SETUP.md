# SETUP — Entorno local y despliegue en Vercel

> Referenciado por `docs/ai-context/DEVELOPMENT-PLAN.md` (Sprint 0 y Sprint 6). Detalle de stack,
> variables de entorno y prohibiciones en `docs/ai-context/01-stack-and-infra.md`.
>
> Secciones 1–6: entorno local. Sección 7: despliegue a Vercel paso a paso.

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

# Storage (hoy SOLO vercel-blob: cloudflare-r2 está documentado pero no implementado, ver 7.2)
STORAGE_PROVIDER=vercel-blob      # o "cloudflare-r2" (no soportado todavía)
BLOB_READ_WRITE_TOKEN=

# SEO / metadata (obligatoria: app/sitemap.ts lanza error si falta)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

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

---

## 7. Despliegue a Vercel (paso a paso)

Modelo multi-cliente (`01-stack-and-infra.md`, sección 3): **un proyecto de Vercel + un proyecto de
Supabase + un bucket de storage independiente por cliente**, con el mismo código base. Las
diferencias viven solo en variables de entorno y datos — nunca en ramas de código.

Corresponde a los tickets del Sprint 6: `PARC-603` (proyecto + variables), `PARC-604` (dominio),
`PARC-606` (auditoría RLS/GRANT) y `PARC-607` (smoke test de producción).

### 7.0 Prerrequisitos

- **Node ≥ 20.9** — es el `engines.node` que exige Next.js 16.3.5.
- **pnpm 10** — declarado en `packageManager` (`pnpm@10.33.4`); Vercel lo detecta solo.
- Cuentas de **GitHub**, **Vercel** y **Supabase**.
- Repo en GitHub con la rama de producción `main` (las demás ramas generan _preview deploys_).
- Nada de secretos en el repo: `.gitignore` excluye `.env*` y `.vercel`. Todo secreto va en el
  dashboard de Vercel.

### 7.1 Supabase de producción

1. **Crear el proyecto** en Supabase (elegir la región más cercana a los usuarios; guardar la
   contraseña de la base).
2. **Copiar credenciales** desde _Project Settings → API_:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (segura para el navegador, vive bajo RLS)
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (**solo servidor**, nunca `NEXT_PUBLIC_*`)
3. **Ejecutar `docs/schema.sql`** completo en el _SQL Editor_. Crea las 5 tablas
   (`lots`, `views`, `view_transitions`, `lot_hotspots`, `feature_hotspots`), índices, habilita
   **RLS** y define políticas de lectura pública + GRANTs.
4. **Verificar RLS** con la consulta de la sección 7.6 — las 5 tablas deben tener
   `rowsecurity = true`. **Nunca desactivar RLS** (`03-database.md`, regla 2).
5. **Cargar datos reales.** En la fase actual **no existe CRUD en `/admin`** (carga manual por SQL,
   ver `02-architecture.md`, sección 0). **No ejecutar `scripts/seed-client.sql` en producción
   real**: usa `placehold.co`, `example.com` y lotes ficticios; solo sirve para demo/staging.
6. **Usuarios de ventas:** se crean en _Authentication → Users_. Dato importante: las rutas
   `/admin` **todavía no existen**; `middleware.ts` ya protege `/admin/:path*`, así que el usuario
   admin no es necesario hasta que se implemente el panel.

**Qué URL vive en cada columna** (todas son URLs públicas que se pegan a mano por SQL hoy):

| Asset                                            | Columna                      |
| ------------------------------------------------ | ---------------------------- |
| Render fijo de cada vista (`front`/`rear`/`top`) | `views.base_image_url`       |
| Variante sin grid de división (solo `top`)       | `views.alt_image_url`        |
| Cada clip de transición direccional              | `view_transitions.video_url` |
| Plano técnico / mensura del lote                 | `lots.technical_plan_url`    |
| Panorama 360° del lote                           | `lots.image_360_url`         |

### 7.2 Storage (Vercel Blob)

**Estado real del código:** `lib/storage/provider.ts` sólo implementa `vercel-blob`. Si
`STORAGE_PROVIDER=cloudflare-r2`, la app lanza `Unsupported storage provider`. Es una discrepancia
conocida respecto de `01-stack-and-infra.md` (documenta R2 como alterno) — hasta que se implemente
(backlog `PARC-B04`), **usar `vercel-blob`**.

1. En el proyecto de Vercel: **Storage → Create → Blob**, y **conectarlo al proyecto**. Vercel
   inyecta `BLOB_READ_WRITE_TOKEN` automáticamente en todos los entornos. Si el Blob store se crea
   _después_ del primer deploy, **hacer redeploy** para que la variable exista.
2. Los assets se suben con `access: 'public'` (`lib/storage/vercel-blob.provider.ts`); la URL
   pública que devuelve `put()` es la que se guarda en la columna correspondiente de Supabase.
3. Mientras no exista el panel admin, subir los assets por el dashboard/CLI de Blob y pegar la URL
   resultante por SQL en la tabla que corresponda (ver tabla de 7.1).

> Los renders y clips de los seeds (`placehold.co`, `example.com`) **no funcionan en producción**:
> reemplazar todas esas URLs por assets reales alojados en el Blob store del cliente.

### 7.3 Importar el repositorio en Vercel

1. Vercel → **Add New → Project → Import Git Repository** y elegir este repo.
2. Configuración (Vercel la autodetecta; **no sobreescribir** salvo lo indicado):
   - Framework Preset: **Next.js**
   - Root Directory: **raíz del repo** (el alias `@/*` apunta a la raíz, no hay `src/`)
   - Install Command: `pnpm install` · Build Command: `pnpm build` · Output: `.next`
3. **Node.js Version**: `20.x` o `22.x` (cualquiera ≥ 20.9), en _Settings → General_.
4. No hay `vercel.json` ni configuración extra — el build de Next.js 16 no la necesita.
5. **Deploy** (el primer build fallará si `NEXT_PUBLIC_SITE_URL` no está definida; ver 7.4).

### 7.4 Variables de entorno (Vercel → Settings → Environment Variables)

Cargar en **Production** y **Preview** (y Development si se quiere `vercel dev`). Tras cambiar
cualquier variable hay que **redeploy** — las `NEXT_PUBLIC_*` se _inlinean_ en el build.

| Variable                        | Obligatoria | Ámbito       | Nota                                                               |
| ------------------------------- | ----------- | ------------ | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | Sí          | Cliente      | Project URL de Supabase                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí          | Cliente      | `anon public`; protegida por RLS                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | Sí          | **Servidor** | Nunca en `NEXT_PUBLIC_*`                                           |
| `STORAGE_PROVIDER`              | Sí          | Servidor     | `vercel-blob` (único soportado hoy)                                |
| `BLOB_READ_WRITE_TOKEN`         | Sí          | **Servidor** | Lo inyecta Vercel al conectar el Blob store                        |
| `NEXT_PUBLIC_SITE_URL`          | **Sí**      | Cliente      | URL pública final, **sin barra final** (ej. `https://cliente.com`) |
| `NEXT_PUBLIC_SENTRY_DSN`        | No          | Cliente      | Ver nota de Sentry abajo (aún no cableado)                         |
| `SENTRY_AUTH_TOKEN`             | No          | Servidor     | Solo source maps en build                                          |
| `NEXT_PUBLIC_CLIENT_SLUG`       | No          | Cliente      | Solo identificación en logs; **no** ramifica lógica                |

**Puntos críticos:**

- `NEXT_PUBLIC_SITE_URL` es **imprescindible**: `app/sitemap.ts` lanza un error si falta (además es
  la `metadataBase` de Open Graph y la base del JSON-LD). Sin ella, `/sitemap.xml` devuelve 500.
- Ningún secreto va en una variable `NEXT_PUBLIC_*`: quedan embebidos en el bundle del navegador.
- El valor de `NEXT_PUBLIC_SITE_URL` debe coincidir con el dominio real; si primero se despliega en
  `*.vercel.app`, usar esa URL y cambiarla al configurar el dominio (7.5) + redeploy.

> **Sentry (pendiente, `PARC-601`):** `@sentry/nextjs` está instalado pero **no está cableado**
> (no hay `instrumentation.ts` ni configs de Sentry). Definir `NEXT_PUBLIC_SENTRY_DSN` **no** captura
> errores todavía; requiere el trabajo de `PARC-601`.

### 7.5 Dominio custom

1. Vercel → _Settings → Domains → Add_ y seguir las instrucciones de DNS (registro `A`/`CNAME`).
2. **Actualizar `NEXT_PUBLIC_SITE_URL`** al dominio final y **redeploy** (si no, Open Graph, JSON-LD
   y sitemap seguirán apuntando al dominio anterior).
3. Verificar compartiendo el link de un lote (preview de WhatsApp/redes) y abriendo `/sitemap.xml`.

### 7.6 Verificación post-deploy (checklist)

- [ ] `/` muestra las 3 vistas y las transiciones reproducen en ambos sentidos (`front↔rear`,
      `front↔top`); no hay clips `rear↔top` (decisión de arquitectura).
- [ ] `/lot/<id>` de un lote real renderiza datos; un id inexistente devuelve **404**.
- [ ] `/sitemap.xml` responde y lista los lotes activos.
- [ ] Open Graph + JSON-LD del lote correctos (usar el validador de Facebook/WhatsApp).
- [ ] El visor 360° abre si el lote tiene `image_360_url` con URL de Blob pública.
- [ ] Todos los assets son reales (cero `placehold.co` / `example.com`).
- [ ] **RLS activo**: las 5 tablas con `rowsecurity = true`:

  ```sql
  select tablename, rowsecurity
  from pg_tables
  where schemaname = 'public'
    and tablename in ('lots', 'views', 'view_transitions', 'lot_hotspots', 'feature_hotspots');
  ```

  Lectura anónima permitida y **escritura anónima bloqueada**:

  ```bash
  # Debe devolver filas (lectura pública OK)
  curl "https://<PROJECT-REF>.supabase.co/rest/v1/views?select=id" \
    -H "apikey: <ANON_KEY>"

  # Debe fallar (401/403): la escritura anónima NO está permitida
  curl -i "https://<PROJECT-REF>.supabase.co/rest/v1/lots" \
    -X POST -H "apikey: <ANON_KEY>" -H "Content-Type: application/json" \
    -d '{"name":"probe"}'
  ```

- [ ] Lighthouse contra la URL de producción (objetivo `01 §7`: **> 85** desktop, **> 70** mobile).
- [ ] `pnpm exec playwright test` apuntando al entorno objetivo (o smoke manual equivalente,
      `PARC-607`).

### 7.7 Flujo de despliegues y rollback

- Push a `main` → **Production**; push a cualquier otra rama → **Preview** (URL única por deploy).
- Rollback: _Deployments → elegir un deploy anterior → Promote to Production_.
- Redeploy manual tras cambiar variables: _Deployments → ⋯ → Redeploy_.

### 7.8 Problemas conocidos

- `STORAGE_PROVIDER=cloudflare-r2` **no funciona** aún (no implementado en el provider).
- Sentry instalado pero **sin cablear** (`PARC-601`).
- Vercel Analytics aún **no instalado** (`PARC-602`).
- `scripts/seed-client.sql` **no es apto para producción** (URLs de placeholder).
- Next 16 avisa que `middleware.ts` será reemplazado por `proxy` — es solo un warning, no bloquea.
- Se usan `<img>` nativos (no `next/image`), por lo que **no** hace falta configurar
  `images.remotePatterns` para el dominio de Blob.

---

**Última actualización:** 2026-10-06 · **Versión:** 2.0
