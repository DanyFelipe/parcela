# 01 — Stack Tecnológico e Infraestructura

> Ver [`00-INDEX.md`](./00-INDEX.md) para las reglas generales de uso de estos documentos.

## Reglas específicas de este documento

1. **No instales ni sugieras una librería que no aparezca en la tabla de la sección 1.** Si la tarea parece requerir una dependencia nueva, detente y pregunta al usuario, citando qué problema concreto no puede resolverse con lo ya disponible.
2. **No cambies de proveedor de infraestructura sin confirmación explícita del usuario.** Migrar de Supabase, Vercel o el storage definido es una decisión de negocio/costos, no una decisión técnica unilateral.
3. **Nunca hardcodees credenciales, URLs de proyecto, ni IDs de cliente.** Todo dato variable por despliegue vive en variables de entorno (sección 4).

---

## 1. Tabla de stack oficial

| Categoría                                                       | Tecnología                                                     | Estado                                                                                                                                                            |
| --------------------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lenguaje                                                        | **TypeScript** (`strict: true`)                                | Obligatorio                                                                                                                                                       |
| Framework                                                       | **Next.js 14+ (App Router)**                                   | Obligatorio                                                                                                                                                       |
| UI                                                              | **React 18+**                                                  | Obligatorio                                                                                                                                                       |
| Estilos                                                         | **Tailwind CSS**                                               | Obligatorio                                                                                                                                                       |
| Componentes UI base                                             | **shadcn/ui** (Radix + Tailwind)                               | Recomendado por defecto                                                                                                                                           |
| Estado de interacción (cliente)                                 | **Zustand**                                                    | Obligatorio                                                                                                                                                       |
| Animación / orquestación de timeline                            | **GSAP**                                                       | Obligatorio para transiciones del showroom                                                                                                                        |
| Animación de UI (paneles, fades)                                | **Framer Motion**                                              | Opcional, solo UI — no para reproducción de frames                                                                                                                |
| Reproducción de transiciones entre vistas                       | **`<video>` HTML nativo** (MP4/WebM)                           | Obligatorio — cada dirección (`front→rear`, `rear→front`, etc.) es un clip independiente, reproducido siempre hacia adelante. Ver `02-architecture.md`, sección 5 |
| Visor de imágenes 360°                                          | **Photo Sphere Viewer**                                        | Obligatorio cuando un lote tenga `image_360_url` — se monta bajo demanda, no de forma global                                                                      |
| Base de datos                                                   | **Supabase (Postgres)**                                        | Obligatorio                                                                                                                                                       |
| Autenticación                                                   | **Supabase Auth**                                              | Obligatorio                                                                                                                                                       |
| Storage de renders fijos, videos de transición y assets de lote | **Vercel Blob** (default) / **Cloudflare R2** (alterno)        | Obligatorio vía interfaz abstraída — ver `02-architecture.md`                                                                                                     |
| Hosting frontend                                                | **Vercel**                                                     | Obligatorio                                                                                                                                                       |
| Validación de datos (runtime)                                   | **Zod**                                                        | Obligatorio                                                                                                                                                       |
| Formularios                                                     | **React Hook Form** + `@hookform/resolvers/zod`                | Obligatorio en panel admin                                                                                                                                        |
| Linting                                                         | **ESLint** (config Next.js + TypeScript)                       | Obligatorio                                                                                                                                                       |
| Formateo                                                        | **Prettier**                                                   | Obligatorio                                                                                                                                                       |
| Git hooks                                                       | **Husky + lint-staged**                                        | Obligatorio                                                                                                                                                       |
| Testing unitario                                                | **Vitest** + **React Testing Library**                         | Obligatorio en lógica de negocio                                                                                                                                  |
| Testing E2E                                                     | **Playwright**                                                 | Obligatorio en flujo crítico (rotación → lote → detalle → volver)                                                                                                 |
| Monitoreo de errores                                            | **Sentry**                                                     | Obligatorio en producción                                                                                                                                         |
| Analítica                                                       | **Vercel Analytics** (o Plausible si se requiere cero-cookies) | Recomendado                                                                                                                                                       |
| Pipeline offline de assets                                      | **ffmpeg + Sharp (Node)** o script Python                      | Obligatorio, fuera del runtime de la app                                                                                                                          |
| Control de versiones                                            | **Git + GitHub**                                               | Obligatorio                                                                                                                                                       |
| CI/CD                                                           | **Vercel Git Integration**                                     | Obligatorio                                                                                                                                                       |
| Gestor de paquetes                                              | **pnpm**                                                       | Obligatorio                                                                                                                                                       |

## 2. Explícitamente prohibido (salvo instrucción directa y explícita del usuario)

- React Router / React Router DOM (Next.js ya rutea por sistema de archivos)
- Redux / Redux Toolkit (reemplazado por Zustand)
- Create React App / Vite como base del proyecto
- CSS Modules, styled-components, Emotion como sistema principal de estilos
- Firebase, MongoDB, PlanetScale, AWS DynamoDB como reemplazo de Supabase
- AWS S3 directo, Cloudinary, o cualquier SDK de storage llamado fuera de la interfaz `StorageProvider`
- Reproducir un mismo clip de video en reversa (`playbackRate` negativo) o intentar scrubbing interactivo sobre un `<video>` — cada dirección de transición es siempre su propio clip independiente reproducido hacia adelante (ver `02-architecture.md`, sección 5)
- `any` de TypeScript como solución permanente
- Sanity.io, Strapi, Contentful u otro CMS headless (decisión tomada: Supabase + panel admin propio)

## 3. Modelo de despliegue (multi-cliente)

Cada cliente (inmobiliaria) tiene:

- Un proyecto de **Vercel** independiente, con su propio dominio.
- Un proyecto de **Supabase** independiente (su propia base de datos y autenticación).
- Un bucket/carpeta de **storage** independiente (mismo proveedor o distinto, según lo que convenga a ese cliente puntual).
- El mismo **código base** (este repositorio/template), diferenciado únicamente por variables de entorno y datos.

**Consecuencia para el agente de IA:** nunca escribir lógica condicional del tipo `if (cliente === "inmobiliaria-x")` dentro del código de la plantilla. Cualquier diferencia entre clientes se resuelve con datos (Supabase) o configuración (variables de entorno), nunca con ramas de código específicas de un cliente.

## 4. Variables de entorno esperadas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # SOLO servidor. Nunca en NEXT_PUBLIC_*, nunca en cliente.

# Storage (elegir uno)
STORAGE_PROVIDER=vercel-blob        # o "cloudflare-r2"
BLOB_READ_WRITE_TOKEN=              # si STORAGE_PROVIDER=vercel-blob
CLOUDFLARE_R2_ACCOUNT_ID=           # si STORAGE_PROVIDER=cloudflare-r2
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET_NAME=

# Observabilidad
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=                  # solo para source maps en build, nunca en cliente

# Identidad del despliegue (para logs/analítica, no para lógica condicional de código)
NEXT_PUBLIC_CLIENT_SLUG=            # ej. "inmobiliaria-los-robles" — solo identificación, no ramifica lógica
```

**Regla:** un agente de IA nunca escribe valores reales de estas variables en código, commits, issues, o cualquier documento — solo el nombre de la variable y su propósito.

## 5. Checklist de onboarding de un cliente nuevo (referencia operativa)

1. Crear proyecto en Supabase → correr `docs/schema.sql` → configurar RLS → crear usuario(s) de ventas.
2. Crear bucket de storage (Vercel Blob o R2) para el cliente.
3. Crear proyecto en Vercel, conectar el repo (o un fork/branch si el cliente requiere personalización de código, lo cual debe ser la excepción, no la norma).
4. Configurar variables de entorno del cliente en Vercel.
5. Configurar dominio custom del cliente en Vercel.
6. Correr el pipeline de generación de assets (D5 → Photoshop → IA → ffmpeg) y subir al bucket del cliente.
7. Smoke test manual + correr suite de Playwright contra el dominio del cliente antes de entregarlo.

## 6. SEO (requisito no negociable, no una tecnología aparte)

El SEO no se resuelve con una librería adicional — se logra usando correctamente lo que Next.js ya ofrece. Es prioridad de producto: el showroom debe ser encontrable en buscadores, no solo compartible por link directo.

**Obligatorio para todo agente de IA que trabaje en páginas públicas (`app/page.tsx`, `app/lot/[id]/page.tsx`):**

- **Metadata dinámica por página** vía `generateMetadata` de Next.js — cada lote genera su propio `<title>` y `<meta description>` a partir de sus datos reales (nombre, precio, superficie), nunca un título genérico repetido en todas las páginas.
- **Open Graph e imagen de preview**: cada lote debe tener una imagen representativa (ej. su `base_image_url` o una captura de su plano técnico) configurada como `og:image`, para que se vea bien al compartir en WhatsApp/redes — canal de distribución habitual en ventas inmobiliarias.
- **Datos estructurados JSON-LD** usando el vocabulario de schema.org apropiado para listados inmobiliarios, incluyendo precio y disponibilidad cuando el estado del lote lo permita.
- **Sitemap dinámico** (`app/sitemap.ts`) que liste automáticamente cada lote activo, generado a partir de los datos de Supabase, no mantenido a mano.
- **Renderizado en servidor real, no solo apariencia de servidor**: la información esencial de cada lote (nombre, precio, descripción) debe estar presente en el HTML servido inicialmente (Server Components), no depender de un `useEffect` en cliente que la traiga después — de lo contrario los buscadores pueden no verla.
- **Core Web Vitals como criterio de aceptación**: dado que este proyecto carga renders fijos pesados y videos de transición, un agente de IA no puede considerar "terminada" una vista pública sin verificar que no está bloqueando el LCP con carga innecesaria — ver presupuesto de performance en la sección 7 siguiente.

**Regla:** un agente de IA que cree o modifique una página pública nueva debe incluir su `generateMetadata` correspondiente en el mismo cambio, no como una tarea separada "para después".

## 7. Presupuesto de performance (referencia para decisiones técnicas)

- Peso máximo del render fijo de cada vista (`base_image_url`): **objetivo < 300 KB** en WebP/AVIF a la resolución de entrega definida para el proyecto.
- Peso máximo por clip de video de transición: **objetivo < 3-5 MB** por clip (ajustar según duración/resolución real, pero cualquier clip que se acerque al peso de un video de "calidad completa" sin optimizar es una señal de que falta compresión). Codificar en H.264 (MP4) con un WebM como fuente alterna para navegadores que lo prefieran.
- Preferir **WebP** sobre PNG para los renders fijos; evaluar **AVIF** si el navegador objetivo lo soporta ampliamente al momento del desarrollo.
- El video de transición debe poder **empezar a reproducirse sin esperar la descarga completa** (usar `preload="auto"` con el clip ya precargado en cuanto el usuario entra a una vista desde la que puede disparar esa transición, no recién al hacer click).
- Objetivo de Lighthouse Performance en la vista general del showroom: **> 85** en desktop, **> 70** en mobile (rangos realistas dado el peso visual del producto, no un ideal teórico inalcanzable).

---

**Última actualización:** 2026-09-16 · **Versión:** 1.3
