# DEVELOPMENT-PLAN.md — Plan de Desarrollo por Sprints

> Plan de ejecución del MVP de la plantilla base (cliente de referencia, sin nombre comercial aún). Cada ticket referencia el documento de `docs/ai-context/` donde vive su especificación completa — este plan no repite el detalle técnico, lo organiza en orden de trabajo.

## Convenciones

- **Código de ticket:** `PARC-XXX` (secuencial, no se reutilizan números aunque un ticket se cancele).
- **Prioridad:** 🔴 Bloqueante (nada avanza sin esto) · 🟡 Alta · 🟢 Normal.
- **Estimación:** en puntos de historia relativos (1 = trivial, 2-3 = tarea normal, 5 = compleja, 8 = considerar dividir).
- **Estado:** `Todo` · `In Progress` · `In Review` · `Done`.
- **Definition of Done (DoD) global** — aplica a **todo** ticket de código, además de sus criterios de aceptación específicos:
  1. Cumple el checklist de calidad de `04-coding-standards.md` (sección 7) y no incurre en ningún anti-patrón de la sección 8.
  2. TypeScript estricto, sin `any` sin justificar.
  3. Sigue la estructura de carpetas de `02-architecture.md`, sección 1.
  4. Si toca flujo crítico (transición de video, store de Zustand, Server Actions), tiene al menos una prueba (Vitest o Playwright).
  5. Commit en formato Conventional Commits, referenciando el ticket (`feat(PARC-104): ...`) — ejecutado **solo tras aprobación explícita del usuario** (ver `04-coding-standards.md`, sección 2.1).
  6. Pasa Husky/lint-staged sin errores.

### Estrategia única de verificación externa

Cada integración externa se valida en tres capas, sin mezclar responsabilidades:

| Capa              | Comando/herramienta                      | Qué demuestra                                                                           | Requiere credenciales reales |
| ----------------- | ---------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| Unitario          | `pnpm test` (Vitest)                     | Contratos y manejo de errores con SDKs mockeados                                        | No                           |
| Integración local | `pnpm test:integration`                  | Conexión real, autenticación, lectura/escritura controlada y eliminación cuando aplique | Sí, desde `.env.local`       |
| Producción        | `pnpm exec playwright test` + smoke test | Que el despliegue, variables, RLS, storage y flujo crítico funcionan juntos             | Sí, en el entorno objetivo   |

La suite unitaria nunca sustituye la prueba de integración. Los tests de integración son opt-in, no se ejecutan en cada `pnpm test`, no imprimen secretos y deben limpiar los datos/asset de prueba que creen.

---

## Sprint 0 — Fundación del proyecto ✅ COMPLETADO

Objetivo: entorno de desarrollo funcional, stack instalado, base de datos conectada. Ya ejecutado siguiendo `docs/SETUP.md`.

| Ticket   | Título                                                                    | Prioridad | Estado |
| -------- | ------------------------------------------------------------------------- | --------- | ------ |
| PARC-001 | Scaffold del proyecto Next.js + TypeScript + Tailwind                     | 🔴        | Done   |
| PARC-002 | Instalación completa de dependencias del stack                            | 🔴        | Done   |
| PARC-003 | Configuración de shadcn/ui + limpieza de modo oscuro inerte               | 🔴        | Done   |
| PARC-004 | Husky + lint-staged + Prettier configurados                               | 🔴        | Done   |
| PARC-005 | Proyecto Supabase creado + `schema.sql` ejecutado + RLS/GRANT verificados | 🔴        | Done   |
| PARC-006 | Clientes Supabase (browser/server) + prueba de conexión                   | 🔴        | Done   |
| PARC-007 | Middleware de autenticación de `/admin`                                   | 🔴        | Done   |
| PARC-008 | `AGENTS.md`/`CLAUDE.md` + `docs/ai-context/` en el repo                   | 🟡        | Done   |
| PARC-009 | Vitest + Playwright configurados y verificados                            | 🟡        | Done   |
| PARC-010 | Git inicializado, repo remoto conectado                                   | 🔴        | Done   |

---

## Sprint 1 — Núcleo del showroom: vistas estáticas + transición de video

Objetivo: el usuario puede ver el terreno en `front` y rotar hacia `rear` con la animación de video real, sin hotspots todavía. Esta es la columna vertebral de todo lo demás.

| Ticket   | Título                                                                                      | Prioridad | Estimación | Estado |
| -------- | ------------------------------------------------------------------------------------------- | --------- | ---------- | ------ |
| PARC-101 | Seed de datos de prueba: `views` (front/rear/top) con imágenes placeholder                  | 🔴        | 2          | Done   |
| PARC-102 | Módulo `lib/storage`: interfaz `StorageProvider` + implementación Vercel Blob               | 🔴        | 5          | Done   |
| PARC-103 | Store de Zustand (`showroom.store.ts`): `currentView`, `transitionInProgress`               | 🔴        | 2          | Done   |
| PARC-104 | Componente `TransitionVideoPlayer` (reproduce clip, dispara `onComplete`)                   | 🔴        | 5          | Done   |
| PARC-105 | `app/page.tsx`: Server Component que lee `views` y renderiza imagen fija en reposo          | 🔴        | 3          | Done   |
| PARC-106 | `ViewControls`: botón de rotación `front↔rear` (sin reversa, ver `02-architecture.md` §7.4) | 🔴        | 3          | Done   |
| PARC-107 | Seed de datos: `view_transitions` con clips de video placeholder                            | 🔴        | 1          | Done   |
| PARC-108 | Test unitario: lógica de resolución de qué clip corresponde según vista actual/destino      | 🟡        | 2          | Done   |
| PARC-109 | Test E2E: cargar showroom → click rotar → ver cambio de vista completo                      | 🟡        | 3          | Done   |
| PARC-110 | Manejo de error: clip de video falla al cargar → fallback a `base_image_url` (04, §4)       | 🟢        | 2          | Done   |
| PARC-111 | Smoke tests de integraciones locales: Supabase + Vercel Blob con credenciales reales        | 🔴        | 3          | Done   |

**Criterio de salida del sprint:** un usuario puede abrir `/`, ver el render `front`, hacer click en rotar, ver el video de transición reproducirse, y terminar en `rear` — y viceversa. Sin hotspots, sin vista `top` todavía.

**Criterio adicional de integración:** antes de cerrar el sprint, `PARC-111` debe demostrar desde el entorno local que Supabase responde con RLS activo y que Vercel Blob permite subir, resolver la URL y eliminar un asset temporal de prueba. La infraestructura opt-in ya está lista: `pnpm test:integration` (runner `vitest.integration.config.ts`, directorio `tests/integration/`, credenciales desde `.env.local`) — ver la estrategia de verificación al inicio de este documento.

---

## Sprint 2 — Vista `top` + sistema completo de hotspots

Objetivo: navegación hacia `top`, hotspots de lote funcionando ahí, y los `feature_hotspots` en `front`.

| Ticket   | Título                                                                                                                                                                                                                               | Prioridad | Estimación |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---------- |
| PARC-201 | Seed: transición `front↔top` + datos de prueba de 5-8 lotes en `lots`                                                                                                                                                                | 🔴        | 2          | Done        |
| PARC-202 | Control de UI dedicado para entrar/salir de `top` (distinto del ciclo front/rear)                                                                                                                                                    | 🔴        | 2          | Done        |
| PARC-203 | Seed: `lot_hotspots` (posiciones % de cada lote en `top`)                                                                                                                                                                            | 🔴        | 2          | Done        |
| PARC-204 | Componente `Hotspot` + renderizado condicional (solo visible en `top`, ver 02 §7.1)                                                                                                                                                  | 🔴        | 3          | In Progress |
| PARC-205 | Patrón fade-out/fade-in de hotspots al iniciar/terminar transición                                                                                                                                                                   | 🟡        | 2          |
| PARC-206 | Seed: `feature_hotspots` en `front` (mínimo: `lots_overview`, `sales_office`)                                                                                                                                                        | 🟡        | 1          |
| PARC-207 | Componente `FeatureHotspot` + despacho `navigate_to_view` vs `show_info`                                                                                                                                                             | 🔴        | 5          |
| PARC-208 | Componente `FeatureInfoPopover` (panel simple, Framer Motion)                                                                                                                                                                        | 🟡        | 2          |
| PARC-209 | Toggle de grid en vista `top` (`base_image_url` ↔ `alt_image_url`)                                                                                                                                                                   | 🟢        | 2          |
| PARC-210 | Consejo UX de saturación: marcadores pequeños + color por `status`                                                                                                                                                                   | 🟡        | 3          |
| PARC-211 | Test E2E: flujo completo front → top (control o hotspot `lots_overview`) → click en lote                                                                                                                                             | 🟡        | 3          |
| PARC-212 | Schema de validación Zod del lote (`lib/validations/lot.schema.ts`) alineado a `docs/schema.sql` — sin UI de CRUD todavía (ver `02-architecture.md` §0: definir la validación desde ya, aunque hoy nadie la use desde un formulario) | 🟡        | 3          |

**Criterio de salida del sprint:** el usuario puede llegar a `top` de dos formas (control dedicado o hotspot `lots_overview`), ver los lotes marcados con color según estado, y clickear uno.

---

## Sprint 3 — Ficha del lote: preview + página completa indexable (SEO)

Objetivo: los dos niveles de información del lote, con la página completa cumpliendo los requisitos de SEO ya definidos.

| Ticket   | Título                                                                                            | Prioridad | Estimación |
| -------- | ------------------------------------------------------------------------------------------------- | --------- | ---------- |
| PARC-301 | Componente `HotspotPreviewCard` (modal rápido: precio, superficie, estado)                        | 🔴        | 3          |
| PARC-302 | `app/lot/[id]/page.tsx`: Server Component con datos completos del lote                            | 🔴        | 5          |
| PARC-303 | `generateMetadata` dinámico (title, description) por lote                                         | 🔴        | 2          |
| PARC-304 | Open Graph (`og:image`) + JSON-LD (schema.org) por lote                                           | 🟡        | 3          |
| PARC-305 | `app/sitemap.ts` dinámico generado desde `lots`                                                   | 🟡        | 2          |
| PARC-306 | Sección de plano técnico + servicios + estado legal en la ficha completa                          | 🔴        | 3          |
| PARC-307 | Botón "volver" (navegación normal, sin animación — ver 02 §8.2)                                   | 🟢        | 1          |
| PARC-308 | Test E2E: hotspot → preview → "ver ficha completa" → página indexable carga con metadata correcta | 🟡        | 3          |

**Criterio de salida del sprint:** cada lote tiene una URL real (`/lot/[id]`) indexable, con toda la ficha ampliada, accesible desde el preview rápido.

---

## Sprint 4 — Visor 360° + pulido de interacción

Objetivo: la pieza opcional de inmersión (360°) y afinar detalles de UX ya identificados en diseño.

| Ticket   | Título                                                                            | Prioridad | Estimación |
| -------- | --------------------------------------------------------------------------------- | --------- | ---------- |
| PARC-401 | Integración de Photo Sphere Viewer (`Viewer360.tsx`)                              | 🟡        | 5          |
| PARC-402 | Botón "Ver en 360°" condicional a `image_360_url` no nulo                         | 🟡        | 1          |
| PARC-403 | Estado de carga del visor 360° (puede pesar más que un frame normal)              | 🟢        | 2          |
| PARC-404 | Precarga de clips de transición (`preload="auto"`) al entrar a una vista (04, §6) | 🟡        | 3          |
| PARC-405 | Respeto de `prefers-reduced-motion` (salta directo a imagen fija)                 | 🟢        | 2          |
| PARC-406 | Accesibilidad: `aria-label`, navegación por teclado en hotspots y controles       | 🟡        | 3          |

**Criterio de salida del sprint:** experiencia inmersiva completa según lo diseñado, con las capas de accesibilidad y performance ya contempladas en los documentos base.

---

## Sprint 5 — Diseño visual real (shadcn/ui + skill `frontend-design`) + Responsive

Objetivo: reemplazar cualquier estilo genérico/placeholder por la dirección de diseño del proyecto (`shadcn/ui` estándar + skill `frontend-design`, ver `00-INDEX.md`), y aplicar la estrategia responsive específica del proyecto.

| Ticket   | Título                                                                                        | Prioridad | Estimación |
| -------- | --------------------------------------------------------------------------------------------- | --------- | ---------- |
| PARC-501 | Tokens de color/tipografía/spacing en `tailwind.config`/`globals.css` según shadcn/ui + skill | 🔴        | 3          |
| PARC-502 | Estilo "vidrio esmerilado" en paneles flotantes (preview, popover, ficha)                     | 🟡        | 3          |
| PARC-503 | Layout responsive de la UI general (navbar, paneles → bottom sheet en mobile)                 | 🔴        | 5          |
| PARC-504 | Scroll/slider horizontal para el render en mobile (sin reescalar hotspots, ver 02 §11)        | 🔴        | 5          |
| PARC-505 | Verificación de contraste AA en texto sobre imagen                                            | 🟢        | 2          |
| PARC-506 | Auditoría Lighthouse (Performance > 85 desktop / > 70 mobile, ver 01 §7)                      | 🟡        | 3          |

**Criterio de salida del sprint:** el showroom se ve y se siente como el producto final diseñado con shadcn/ui + la skill `frontend-design`, en desktop y mobile.

---

## Sprint 6 — Endurecimiento, monitoreo y despliegue

Objetivo: dejar el proyecto listo para mostrarse a un cliente real (piloto) en producción.

| Ticket   | Título                                                                                          | Prioridad | Estimación |
| -------- | ----------------------------------------------------------------------------------------------- | --------- | ---------- |
| PARC-601 | Configuración de Sentry (captura de errores en producción)                                      | 🟡        | 2          |
| PARC-602 | Vercel Analytics integrado                                                                      | 🟢        | 1          |
| PARC-603 | Proyecto conectado a Vercel + variables de entorno de producción                                | 🔴        | 2          |
| PARC-604 | Dominio custom configurado (si ya hay uno para el cliente piloto)                               | 🟢        | 1          |
| PARC-605 | Suite completa de Playwright cubriendo el flujo crítico end-to-end                              | 🔴        | 5          |
| PARC-606 | Revisión final de RLS/GRANT en el proyecto de producción de Supabase                            | 🔴        | 2          |
| PARC-607 | Smoke test manual completo del entorno de producción (sin repetir el smoke local de `PARC-111`) | 🔴        | 2          |

**Criterio de salida del sprint:** el proyecto está en producción, monitoreado, con dominio real, listo para el primer cliente piloto.

`PARC-603` configura el entorno de producción; `PARC-606` audita RLS/GRANT; `PARC-607` comprueba el sistema desplegado de extremo a extremo. Ninguno reemplaza ni repite el smoke test local de `PARC-111`.

---

## Backlog (fuera de sprint — no iniciar sin discusión explícita)

Estos ítems están **intencionalmente pospuestos**. No deben iniciarse por iniciativa propia (de un desarrollador o un agente de IA) sin que el usuario lo solicite explícitamente — ver `02-architecture.md`, sección 0.

| Ticket   | Título                                             | Por qué está en backlog                                             |
| -------- | -------------------------------------------------- | ------------------------------------------------------------------- |
| PARC-B01 | CRUD autenticado en `/admin` para `lots`           | Fase actual: carga manual por SQL (decisión de producto ya tomada)  |
| PARC-B02 | Herramienta "click para fijar hotspot" en `/admin` | Mencionada como mejora futura, sin definir aún                      |
| PARC-B03 | Agrupación de hotspots por manzana/sector          | Solo si se detecta saturación real en un cliente con muchos lotes   |
| PARC-B04 | Migración de storage a Cloudflare R2               | Solo si el costo de egress de Vercel Blob se vuelve significativo   |
| PARC-B05 | Selector de tema claro/oscuro                      | Decisión de producto ya tomada: tema fijo único (ver `00-INDEX.md`) |
| PARC-B06 | Internacionalización (i18n) multi-idioma           | No solicitado; evaluar si un cliente lo requiere                    |

---

## Cómo usar este documento con un agente de IA

Al iniciar trabajo en un ticket, el prompt recomendado es:

```
Trabajemos en PARC-104 (TransitionVideoPlayer). Lee docs/ai-context/00-INDEX.md
y los documentos que correspondan antes de escribir código. Cumple la
Definition of Done de docs/ai-context/DEVELOPMENT-PLAN.md.
```

Esto asegura que el agente cargue el contexto correcto (vía `AGENTS.md` → `00-INDEX.md`) antes de tocar código, y se autoevalúe contra la DoD antes de dar el ticket por terminado.

---

**Última actualización:** 2026-09-24 · **Versión:** 1.6
