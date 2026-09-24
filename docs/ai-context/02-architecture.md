# 02 — Arquitectura y Patrones

> Ver [`00-INDEX.md`](./00-INDEX.md) para las reglas generales. Ver [`01-stack-and-infra.md`](./01-stack-and-infra.md) para el detalle de tecnologías mencionadas aquí. Ver [`03-database.md`](./03-database.md) para el esquema completo de las tablas referenciadas en este documento.

## Reglas específicas de este documento

1. **Antes de crear un archivo nuevo, verifica si la estructura de carpetas de la sección 1 ya define dónde debe vivir.** No crear carpetas nuevas de nivel raíz (`/src`, `/utils`, `/helpers`) sin justificar explícitamente por qué la estructura existente no alcanza.
2. **Los patrones descritos aquí (`StorageProvider`, `TransitionPlayer`, Server Actions, Zustand store) son contratos, no sugerencias.** Un agente de IA no debe "simplificar" saltándose la abstracción, incluso si parece más rápido para una tarea puntual.
3. Si necesitas agregar un método nuevo a una interfaz ya definida, debes implementarlo en **todas** las implementaciones existentes en el mismo cambio.
4. **Todo identificador de código (variables, funciones, componentes, nombres de tabla/columna) va en inglés**, sin excepción — es la misma regla de `04-coding-standards.md` aplicada aquí a cada ejemplo. El contenido de negocio que ve el usuario final (labels, textos) sí va en español, pero eso vive en componentes de UI y en los datos, no en nombres de variables o de esquema.

---

## 0. Fase actual del proyecto (leer antes de proponer o construir cualquier pantalla de `/admin`)

**En esta fase, toda la carga de datos (`lots`, `views`, `view_transitions`, `lot_hotspots`) se hace manualmente vía SQL directo en Supabase — no existe todavía un CRUD en `/admin`.** Un agente de IA no debe construir formularios, tablas editables, ni Server Actions de escritura en `/admin` a menos que se le pida explícitamente — hacerlo ahora sería trabajo prematuro sobre una interfaz que aún no se ha validado que se necesite en esa forma.

**Lo que SÍ debe hacerse ahora para que el CRUD futuro se acople sin fricción (esto es lo que hace que la arquitectura ya esté "lista" para ese momento):**

- Los esquemas de validación Zod (`lib/validations/lot.schema.ts`) se definen desde ya, con la forma real de los datos — aunque hoy nadie los use desde un formulario, son la base de la validación que el futuro CRUD reutilizará sin cambios.
- Las políticas RLS (`03-database.md`) se mantienen correctas y probadas desde ya — el día que exista un formulario de escritura, la seguridad ya está resuelta a nivel de base de datos, no depende de que el formulario "se acuerde" de validar permisos.
- El patrón de Server Actions (`02-architecture.md`, sección 3) se usa desde ya para _cualquier_ mutación que sí se implemente (por ejemplo, si en algún punto intermedio se agrega solo la edición de `status`/`price` de un lote antes que el resto del CRUD) — nunca se escribe una mutación directa desde un componente cliente "porque total es temporal".
- La estructura de carpetas ya reserva el espacio (`app/admin/`, `components/admin/LotForm.tsx`, `components/admin/LotTable.tsx`) — construirlos es agregar código dentro de un espacio ya definido, no rediseñar nada.

**Regla para el agente de IA:** si una tarea pide "agregar un campo nuevo" o "cambiar una regla de negocio", el cambio se refleja en el esquema SQL y en el schema de Zod correspondiente, **aunque hoy no haya ningún formulario que lo use** — así, cuando se construya el CRUD, ya encuentra todo listo.

## 1. Estructura de carpetas

```
/app
  /page.tsx                      → Showroom público, vista general del terreno
  /lot/[id]/page.tsx             → Página completa e indexable del lote (ficha ampliada, ver sección 8.2)
  /admin
    /page.tsx                    → Panel CRUD de lotes (protegido)
    /login/page.tsx              → Login del usuario de ventas
    /actions.ts                  → Server Actions (mutaciones a Supabase)
  /layout.tsx                    → Layout raíz (fuentes, providers globales)

/components
  /showroom
    /TransitionVideoPlayer.tsx   → Reproductor de video para transiciones entre vistas (ver sección 6)
    /Hotspot.tsx                 → Punto interactivo de un lote (exclusivo de la vista top, ver sección 7.1)
    /HotspotPreviewCard.tsx      → Modal rápido con datos básicos al hacer click en un hotspot de lote
    /FeatureHotspot.tsx          → Marcador especial de punto de interés en 'front' (ver sección 7.2)
    /FeatureInfoPopover.tsx      → Panel simple para hotspots especiales con action = 'show_info'
    /ViewControls.tsx            → Botón de rotación front↔rear + control dedicado para top (ver sección 7.4)
    /Viewer360.tsx               → Wrapper de Photo Sphere Viewer
  /admin
    /LotForm.tsx                 → Formulario de edición (RHF + Zod) — ver sección 0, no construir aún
    /LotTable.tsx                → Listado de lotes — ver sección 0, no construir aún
  /ui                             → Componentes shadcn/ui (no editar manualmente los generados)

/lib
  /storage
    /types.ts                    → Interfaz StorageProvider (contrato obligatorio)
    /provider.ts                 → Factory según STORAGE_PROVIDER
    /vercel-blob.provider.ts
    /cloudflare-r2.provider.ts
  /transitions
    /types.ts                    → Interfaz TransitionPlayer (contrato obligatorio, ver sección 6)
    /video-transition-player.ts  → Implementación con <video> nativo (default actual)
  /supabase
    /client.ts                   → Cliente para 'use client' (navegador)
    /server.ts                   → Cliente para Server Components/Actions
  /validations
    /lot.schema.ts                → Esquemas Zod (fuente única de validación)
  /store
    /showroom.store.ts            → Zustand: vista actual, lote seleccionado, estado de transición

/docs
  /schema.sql                     → Esquema real y actual de la base de datos
  /ai-context/                    → Este set de documentos

/scripts
  /migrate-storage.ts              → Migración entre proveedores de storage
  /seed-client.sql                 → Script base para onboarding de cliente nuevo

/tests
  /unit
  /e2e
```

## 2. Contrato de `StorageProvider` (obligatorio)

Todo acceso a archivos (videos de transición, renders fijos, imágenes 360°, planos técnicos) pasa por esta interfaz — nunca se llama directamente al SDK de un proveedor desde un componente, página o Server Action.
**Nota de simplificación respecto a versiones anteriores de este documento:** al pasar de secuencias de frames a video real (sección 6), `StorageProvider` deja de ser una interfaz especializada en "frames numerados" y pasa a ser un **storage de assets genérico** — ya no existe el concepto de manifest de frames ni de frame individual.

`uploadAsset` devuelve la URL canónica creada por el proveedor. `getAssetUrl` es asíncrono porque algunos proveedores necesitan consultar metadata para resolver la URL pública real; no se construyen URLs de storage a mano en consumidores. La implementación actual con Vercel Blob usa `put`, `head` y `del` del SDK oficial, manteniendo el token exclusivamente en el servidor.

```typescript
// lib/storage/types.ts
export interface StorageProvider {
  getAssetUrl(clientId: string, assetPath: string): Promise<string>;
  uploadAsset(clientId: string, assetPath: string, file: Buffer): Promise<string>;
  deleteAsset(clientId: string, assetPath: string): Promise<void>;
}
```

Convención de nombres uniforme entre proveedores, organizada por tipo de asset:

```
{clientId}/views/front-base.webp
{clientId}/views/rear-base.webp
{clientId}/views/top-base.webp
{clientId}/transitions/front-to-rear.mp4
{clientId}/transitions/rear-to-front.mp4
{clientId}/transitions/front-to-top.mp4
{clientId}/transitions/top-to-front.mp4
{clientId}/lots/{lotId}/360.jpg
{clientId}/lots/{lotId}/technical-plan.webp
```

## 3. Autenticación: exclusiva de `/admin`, nunca para visitantes del showroom

**Regla fundamental (no reinterpretar bajo ningún escenario futuro sin discusión explícita):** el sistema de login con Supabase Auth existe **únicamente** para el equipo comercial/administrativo que accede a `/admin`. Los visitantes del showroom público (`/`, `/lot/[id]`) **nunca** inician sesión, nunca tienen cuenta, y navegan de forma completamente anónima y libre — esto es un requisito de negocio explícito, no un detalle pendiente de definir. Un agente de IA no debe agregar registro, login, "guardar favoritos", historial de usuario, ni ningún flujo que implique una cuenta de comprador — si una tarea futura lo pidiera, es una funcionalidad completamente nueva que requiere discusión de producto antes de tocar el modelo de autenticación existente.

### 3.1. Middleware de protección de rutas

Todas las rutas bajo `/admin` (excepto `/admin/login`) están protegidas por un middleware de Next.js que corre antes de que cualquier página se renderice, verificando la sesión de Supabase vía cookies:

```typescript
// middleware.ts (raíz del proyecto)
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isLoginRoute = request.nextUrl.pathname === '/admin/login';

  if (isAdminRoute && !isLoginRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

**Regla:** el `matcher` del middleware se limita explícitamente a `/admin/:path*` — nunca se amplía para cubrir rutas del showroom público (`/`, `/lot/[id]`), ya que esas deben permanecer accesibles sin sesión bajo cualquier circunstancia.

### 3.2. Flujo de login

```typescript
// app/admin/login/page.tsx
'use client';
import { createClient } from '@/lib/supabase/client';

async function handleLogin(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // redirigir a /admin tras éxito
}
```

```
Visitante entra a /admin
  → middleware.ts verifica la cookie de sesión con Supabase
  → sin sesión válida → redirige automáticamente a /admin/login
  → llena el formulario → Supabase Auth valida credenciales → cookie de sesión se crea
  → siguiente visita a /admin → middleware detecta la cookie válida → deja pasar
```

**Capas de seguridad independientes y complementarias (no redundantes):** el middleware protege el _acceso a la interfaz_ de `/admin`; las políticas RLS (`03-database.md`) protegen el _acceso a los datos_ a nivel de base de datos, incluso si alguien lograra saltarse el middleware. Ambas capas deben mantenerse — nunca se retira una asumiendo que la otra alcanza.

## 4. Patrón de mutaciones: Server Actions

Toda escritura a Supabase desde el panel `/admin` pasa por una Server Action, nunca por una llamada directa desde un componente cliente al SDK de Supabase con la `service_role key`.

```typescript
// app/admin/actions.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { lotUpdateSchema } from '@/lib/validations/lot.schema';

export async function updateLot(lotId: string, changes: unknown) {
  // 1. Validar sesión
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authorized');

  // 2. Validar forma de los datos con Zod (nunca confiar en el tipo de TS únicamente)
  const parsed = lotUpdateSchema.parse(changes);

  // 3. Ejecutar mutación — RLS sigue siendo la última línea de defensa
  const { data, error } = await supabase.from('lots').update(parsed).eq('id', lotId);
  if (error) throw error;
  return data;
}
```

## 5. Patrón de estado: Zustand (showroom público)

El estado de la experiencia interactiva (vista actual, lote seleccionado, si hay una transición en curso) vive en un store de Zustand, no en `useState` disperso entre componentes ni en la URL únicamente.

```typescript
// lib/store/showroom.store.ts
import { create } from 'zustand';

type ShowroomView = 'front' | 'rear' | 'top';

interface ShowroomState {
  currentView: ShowroomView;
  selectedLotId: string | null;
  transitionInProgress: boolean;
  setView: (view: ShowroomView) => void;
  selectLot: (lotId: string | null) => void;
  setTransitionInProgress: (value: boolean) => void;
}

export const useShowroomStore = create<ShowroomState>((set) => ({
  currentView: 'front',
  selectedLotId: null,
  transitionInProgress: false,
  setView: (currentView) => set({ currentView }),
  selectLot: (selectedLotId) => set({ selectedLotId }),
  setTransitionInProgress: (value) => set({ transitionInProgress: value }),
}));
```

**Regla:** mientras `transitionInProgress` es `true`, los controles de interacción (click en un lote, botón de rotación) deben deshabilitarse — no se permite interrumpir una transición a mitad de reproducción salvo que una tarea futura defina explícitamente ese comportamiento como requisito.

## 6. `TransitionPlayer`: reproducción de transiciones con video real

**Decisión de arquitectura (reemplaza un diseño anterior basado en Canvas + secuencia de frames):** cada transición entre vistas es un **clip de video real** (MP4/WebM), no una secuencia de imágenes. Esto es posible y es la opción correcta porque **cada transición siempre se reproduce hacia adelante, nunca en reversa** — como cada par de vistas tiene dos clips independientes (`front→rear` y `rear→front` son dos archivos de video distintos, dos filas distintas en `view_transitions`), nunca se necesita hacer scrubbing ni reproducir un video al revés, que es justamente donde `<video>` nativo es poco confiable entre navegadores. Fuera de ese caso, video real es más liviano (mejor compresión) y más simple de implementar que una secuencia de frames en Canvas.

**El contrato queda abstraído igual que `StorageProvider`, para que esta decisión sea reemplazable sin rediseñar el resto de la app** si en el futuro un requisito nuevo (ej. scrubbing interactivo real) lo justificara:

```typescript
// lib/transitions/types.ts
export interface TransitionPlayer {
  play(videoUrl: string): Promise<void>; // siempre reproduce hacia adelante, un único sentido
  onComplete(callback: () => void): void;
}
```

```typescript
// lib/transitions/video-transition-player.ts — implementación actual (única por ahora)
export class VideoTransitionPlayer implements TransitionPlayer {
  private videoEl: HTMLVideoElement;
  private completeCallback: (() => void) | null = null;

  constructor(videoEl: HTMLVideoElement) {
    this.videoEl = videoEl;
    this.videoEl.addEventListener('ended', () => this.completeCallback?.());
  }

  async play(videoUrl: string): Promise<void> {
    this.videoEl.src = videoUrl;
    await this.videoEl.play();
  }

  onComplete(callback: () => void): void {
    this.completeCallback = callback;
  }
}
```

**Reglas del componente `TransitionVideoPlayer`:**

- El `<video>` se renderiza con `muted`, `playsInline` y sin controles nativos visibles (`controls={false}`) — el usuario nunca ve la barra de progreso de video, solo el resultado visual.
- Debe precargar (`preload="auto"`) el clip antes de que el usuario pueda dispararlo, cuando sea razonable anticiparlo (ej. precargar `front-to-rear.mp4` apenas se carga la vista `front`).
- Al terminar el clip (`onEnded`), se dispara `setTransitionInProgress(false)` y se hace un cruce breve (`transition-opacity`, ver nota de blur más abajo) hacia la `<img>` de `base_image_url` de la vista de destino — esto evita depender de que el último frame del video sea matemáticamente idéntico al render fijo.
- **Nunca se monta más de un `<video>` de transición a la vez.**

**Nota sobre el cruce/blur de seguridad:** aunque el último frame del clip de IA debería coincidir con el render fijo de destino, se aplica un cruce corto de opacidad (150-200ms) entre el `<video>` terminando y la `<img>` del `base_image_url` apareciendo, como red de seguridad ante pequeñas discrepancias — sin que se perciba como un salto. Esto reemplaza cualquier necesidad de post-procesamiento adicional del video.

## 7. Vistas del terreno general: front, rear y top

**Modelo de contenido visual (fundamental — ver también `03-database.md`):** cada vista es una **imagen fija única** (`views.base_image_url`), un render de D5 retocado en Photoshop, sin ninguna animación en reposo. La **única** animación del producto es la transición entre vistas, reproducida como video real (sección 6). Un agente de IA no debe agregar lógica de loop/reproducción continua a ninguna vista en estado de reposo.

El terreno general define **tres vistas posibles** por proyecto, cada una registrada como una fila en la tabla `views` (ver `03-database.md`):

| Vista (`views.id`) | Tiene hotspots de lote                                              | Tiene hotspots especiales (`feature_hotspots`)    | Propósito                                                                                                                                    |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `front`            | **No** — ver sección 7.1                                            | **Sí**                                            | Vista principal de impacto visual/venta, con puntos de interés (acceso, amenidades, caseta de ventas, punto de entrada al catálogo de lotes) |
| `rear`             | **No**                                                              | **No** (salvo que se decida agregar en el futuro) | Vista contextual/narrativa — sin capa de datos                                                                                               |
| `top`              | **Sí**, sobre grid ya dibujado en post-producción (ver sección 7.2) | No                                                | Vista aérea — único lugar donde se selecciona un lote específico con precisión                                                               |

**Nota de naming:** se usa `front`/`rear`/`top` (inglés) consistente con la regla de que todo identificador técnico va en inglés.

**Cada par de vistas conectadas tiene dos clips de video independientes, uno por dirección — nunca se reproduce un clip en reversa.** Esto ya queda modelado naturalmente por el esquema de `view_transitions` (una fila con `from_view_id`/`to_view_id` por cada sentido), sin necesidad de lógica especial de "reversa" en el código.

**Grafo de transiciones válidas (importante — no asumir que todas las vistas se conectan entre sí):**

```
   rear  ←→  front  ←→  top
```

- `front → rear` y `rear → front`: dos clips de video independientes, existen.
- `front → top` y `top → front`: dos clips de video independientes, existen.
- `rear ↔ top`: **NO existe transición directa en ningún sentido.** Si el usuario está en `rear` y quiere ir a `top` (o viceversa), la navegación pasa obligatoriamente primero por `front`. Un agente de IA no debe generar, solicitar, ni asumir un clip `rear→top`; si una tarea pareciera requerirlo, es señal de que la navegación debe resolverse encadenando `rear→front→top`, no agregando una fila nueva a `view_transitions` sin confirmarlo antes con el usuario.

### 7.1. Hotspots de lote: exclusivos de `top` (decisión de UX, no reinterpretar)

**Los hotspots de lote individual (`lot_hotspots`) son exclusivos de la vista `top`.** La vista `front` **no** lleva hotspots por lote — esto es una decisión de UX deliberada, no una limitación técnica: en perspectiva, los lotes lejanos aparecen pequeños y apretados entre sí, dificultando el click preciso; la proyección aérea de `top` es uniforme y no tiene ese problema (mismo principio por el que los videojuegos usan minimapas top-down para navegación precisa y la vista en perspectiva solo para inmersión).

```typescript
// Constante compartida — única fuente de verdad de en qué vista hay hotspots de lote.
const VIEW_WITH_LOT_HOTSPOTS = 'top' as const;

const currentView = useShowroomStore((s) => s.currentView);
const transitionInProgress = useShowroomStore((s) => s.transitionInProgress);

const showLotHotspots = currentView === VIEW_WITH_LOT_HOTSPOTS && !transitionInProgress;
```

**Patrón de aparición/desaparición (decisión de producto ya confirmada — no es negociable sin nueva discusión explícita):**

- Al **iniciar** cualquier transición de vista, los hotspots de lote visibles hacen **fade-out** antes o junto con el inicio del clip de video.
- Al **finalizar** la transición, si la vista de destino es `top`, los hotspots de lote hacen **fade-in** en sus posiciones (`lot_hotspots` filtrando por `view_id = 'top'`).
- En cualquier otra vista de destino (`front`, `rear`), no se renderiza ningún hotspot de lote.
- Al hacer click en un hotspot de lote **no hay transición de video** — se abre directamente el `HotspotPreviewCard` (ver sección 8).

### 7.2. Hotspots especiales en `front`: puntos de interés del terreno (`feature_hotspots`)

La vista `front` reemplaza los hotspots de lote por **marcadores de puntos de interés generales** — no representan un lote específico, representan algo del terreno como conjunto. Ver el esquema completo (`type`, `action`, `target_view_id`) en `03-database.md`.

**Tipos definidos en el modelo base** (el `check` de la base de datos es la fuente de verdad de cuáles existen):

| `type`            | `action`           | Comportamiento al hacer click                                                                          |
| ----------------- | ------------------ | ------------------------------------------------------------------------------------------------------ |
| `lots_overview`   | `navigate_to_view` | Reproduce el clip `front→top` y navega a la vista `top` — es la puerta de entrada al catálogo de lotes |
| `natural_feature` | `show_info`        | Abre un panel simple con `title`/`description` (bosque, río, laguna, etc.)                             |
| `sales_office`    | `show_info`        | Abre un panel simple con la info de la caseta de ventas                                                |
| `main_access`     | `show_info`        | Abre un panel simple sobre el acceso principal                                                         |
| `amenity`         | `show_info`        | Abre un panel simple sobre un área común (piscina, quincho, cancha, club house)                        |
| `viewpoint`       | `show_info`        | Abre un panel simple sobre un mirador/vista destacable                                                 |
| `future_phase`    | `show_info`        | Abre un panel simple sobre una etapa futura del proyecto                                               |

```
components/showroom/
  └── FeatureHotspot.tsx        → Marcador especial en 'front'. Lee `type`/`action` y decide su comportamiento.
  └── FeatureInfoPopover.tsx    → Panel simple reutilizado por todos los type con action = 'show_info'.
```

```typescript
// components/showroom/FeatureHotspot.tsx — lógica de despacho según action
function handleFeatureClick(hotspot: FeatureHotspot) {
  if (hotspot.action === 'navigate_to_view' && hotspot.targetViewId) {
    const videoUrl = getTransitionVideoUrl(currentView, hotspot.targetViewId);
    transitionPlayer.play(videoUrl);
    // al completar: setView(hotspot.targetViewId)
  } else {
    openFeatureInfoPopover(hotspot); // muestra title/description/icon, sin video
  }
}
```

**Reglas para el agente de IA:**

- `FeatureInfoPopover` es un componente de UI simple (Framer Motion, fade), **nunca** dispara el `TransitionPlayer` — solo `lots_overview` navega.
- No inventar un `type` nuevo fuera del `check` de `feature_hotspots` sin antes confirmarlo con el usuario y agregarlo vía migración — la lista de tipos es intencionalmente acotada para no saturar visualmente la vista `front` (ver razón de diseño en la respuesta que originó esta sección: más de 6-7 tipos de hotspot especial empieza a competir con el propósito de impacto visual de esta vista).
- `rear` no lleva `feature_hotspots` en el modelo base — si un cliente puntual lo necesitara, se evalúa como extensión específica de ese cliente, no como parte de la plantilla base.

### 7.3. Vista top: hotspots de lote sobre grid de post-producción

El grid/delimitación visual de cada lote en la vista top se genera en **Photoshop, como parte del render final** — no se dibuja con SVG ni CSS en la web. La web solo agrega los **hotspots interactivos** posicionados para que caigan visualmente alineados sobre el grid ya renderizado en la imagen.

**Regla para el agente de IA:** nunca implementar el trazado de polígonos de lotes con SVG/Canvas como reemplazo del grid de Photoshop.

### 7.3.1. Sistema de coordenadas de hotspots y workflow futuro del admin

El esquema almacena `hotspot_x` y `hotspot_y` como **porcentajes enteros del ancho y alto del render** (`0` a `100`), no como píxeles absolutos. Esta decisión resuelve dos problemas a la vez: la independencia de la resolución final del render y la estrategia responsive del proyecto.

**¿Por qué porcentajes y no píxeles?**

- El render de `top` puede exportarse a distintas resoluciones según el cliente o el dispositivo de entrega (por ejemplo, 1920×1080 para web rápida, 3840×2160 para pantallas 4K, o un ancho mayor si el terreno es panorámico). Mientras el **aspect ratio** se mantenga constante, un punto `(x=50, y=50)` siempre cae en el centro visual, sea cual sea la cantidad de píxeles.
- En mobile no se reescala el render para "hacerlo caber"; se desplaza horizontalmente dentro de un viewport (ver sección 11). Los porcentajes siguen siendo válidos porque el render y sus hotspots conservan sus dimensiones naturales: el hotspot se posiciona como `%` del ancho/alto real de la imagen, no del viewport.

**Resolución canónica recomendada (decisión de producción, no de código)**

La plantilla no impone una resolución única en píxeles, pero sí exige que todos los renders de un mismo proyecto compartan el **mismo aspect ratio y la misma composición de encuadre**. Se recomienda acordar por proyecto una resolución canónica (ej. 1920×1080 o 2560×1440) y exportar todas las vistas y sus variantes (`alt_image_url`) desde el mismo Photoshop maestro. El código no necesita saber la resolución; solo necesita que la imagen se muestre sin estiramiento.

> **Consecuencia práctica:** si un render se reemplaza por una versión de mayor resolución pero mismo encuadre, los hotspots no requieren recalibración.

**Workflow futuro en `/admin` (no construir ahora, solo diseñar para que encaje)**

Cuando en una fase posterior se construya el CRUD de hotspots, la interfaz deberá:

1. Mostrar el render de `top` a su tamaño natural o escalado proporcionalmente dentro del editor (nunca estirado).
2. Permitir hacer click sobre el render; el sistema convierte la posición del click a porcentaje usando la fórmula:
   ```
   hotspot_x = round((click_x / render_width) * 100)
   hotspot_y = round((click_y / render_height) * 100)
   ```
3. Previsualizar el hotspot inmediatamente sobre la imagen mientras se edita.
4. Validar que `hotspot_x` y `hotspot_y` estén entre `0` y `100` antes de guardar.
5. Garantizar unicidad por `(lot_id, view_id)` para evitar que un mismo lote tenga dos marcadores en la misma vista.

**Reglas de implementación para el admin futuro:**

- No almacenar píxeles ni referencias a la resolución del render en la base de datos; la fuente de verdad son los porcentajes.
- Si el render se muestra escalado en el editor, el cálculo debe usar las dimensiones reales del elemento imagen en pantalla, no las dimensiones del contenedor padre.
- La variante `alt_image_url` de `top` debe tener el mismo encuadre y aspect ratio que `base_image_url`; por eso los hotspots no se ven afectados por el toggle de grid (sección 7.5).

### 7.4. Controles de navegación entre vistas (sin reversa, sin scrubbing)

Como cada transición siempre avanza hacia adelante y nunca hace falta "deshacer" una animación, la UI de navegación se simplifica a dos controles independientes:

- **Botón de rotación `front ↔ rear`:** un único botón que **alterna** entre ambas vistas cada vez que se presiona (`front → rear → front → rear → ...`). Internamente, el componente solo necesita saber la vista actual para decidir qué clip llamar a continuación:

```typescript
// components/showroom/ViewControls.tsx — lógica del botón de rotación front/rear
function handleRotateClick() {
  const nextView = currentView === 'front' ? 'rear' : 'front';
  const videoUrl = getTransitionVideoUrl(currentView, nextView); // busca en view_transitions
  transitionPlayer.play(videoUrl);
  // al completar: setView(nextView)
}
```

- **Control dedicado para `top`:** un botón/ícono separado (no parte del ciclo de rotación anterior) que navega específicamente a la vista `top` desde `front` (usando el clip `front→top`), y de regreso a `front` desde `top` (usando el clip `top→front`). No es un ciclo de alternancia como front/rear — es una vista de consulta puntual a la que se entra y se sale.

**Regla para el agente de IA:** no implementar el control de `top` como parte del mismo ciclo de alternancia que `front`/`rear` — son interacciones de UI distintas (una es "rotar el terreno", la otra es "ver desde arriba puntualmente"), aunque ambas se reproduzcan con el mismo `TransitionPlayer` por debajo. **Este control de UI y el hotspot especial `lots_overview` (sección 7.2) son dos puntos de entrada válidos y redundantes hacia la misma vista `top`** — no es un error ni una duplicación a eliminar, es intencional: el control siempre visible sirve para quien ya sabe qué busca, el hotspot dentro del render sirve como descubrimiento natural para quien está explorando visualmente.

### 7.5. Toggle de grid en la vista top

La vista `top` tiene dos variantes de imagen (`views.base_image_url` con grid, `views.alt_image_url` sin grid — ver `03-database.md`). Un control de UI simple alterna cuál se muestra:

```typescript
// Estado local del componente de vista top (no necesita vivir en el store global de Zustand,
// es un detalle visual de esa vista específica, no parte del flujo de navegación)
const [showGrid, setShowGrid] = useState(true);
const topView = views.find((v) => v.id === 'top');
const imageSrc = showGrid ? topView.baseImageUrl : topView.altImageUrl;
```

**Reglas:**

- Es un cambio instantáneo de imagen, opcionalmente con un fade breve (150-200ms) para suavizar — nunca una transición de video ni parte del sistema de `TransitionPlayer`.
- Los hotspots de lote (`lot_hotspots` filtrados por `view_id = 'top'`) se muestran igual sin importar el estado del toggle — la posición no cambia porque el encuadre es idéntico en ambas variantes.
- Si `alt_image_url` es `null` para la vista `top` (cliente que no generó la variante sin grid), el botón de toggle **no se renderiza** — mismo principio que ya aplicamos al botón de 360°.

## 8. Ficha del lote: dos niveles (preview modal + página completa indexable)

Hacer click en un hotspot de lote **(exclusivo de la vista `top`, ver sección 7.1)** no dispara ninguna transición de video — abre un **preview rápido** con datos básicos, sobre el render actual. Si el usuario quiere más detalle, navega a una **página completa e indexable** con la ficha técnica ampliada.

```
components/showroom/
  └── HotspotPreviewCard.tsx   → Modal/popover ligero al hacer click en un hotspot. Sin URL propia.

app/lot/[id]/page.tsx           → Página completa del lote (Server Component, indexable, con generateMetadata)
```

### 8.1. Nivel 1 — `HotspotPreviewCard` (modal rápido)

- Se abre al hacer click en un hotspot, como overlay de UI (Framer Motion, fade/scale), **nunca con `TransitionVideoPlayer`** — es un componente de interfaz, no una transición del showroom.
- Muestra únicamente datos básicos: nombre/número de lote, precio, superficie, estado (`available`/`reserved`/`sold`).
- No tiene URL propia ni afecta el historial de navegación.
- Incluye un botón/link **"Ver ficha completa"** que navega a `/lot/[id]`.

### 8.2. Nivel 2 — Página completa `/lot/[id]` (indexable)

- Página real del App Router, renderizada en servidor, con su propio `generateMetadata`, Open Graph y JSON-LD (ver `01-stack-and-infra.md`, sección de SEO).
- Muestra el detalle ampliado: plano técnico (`technical_plan_url`), tipo de suelo, servicios disponibles, estado legal, gravámenes, número de registro, descripción completa.
- Si `image_360_url` no es nula, ofrece la opción de abrir el `Viewer360` (sección 9).
- Incluye una acción de "volver" que regresa al showroom (navegación normal de Next.js) — no hay ninguna animación de video asociada a esta vuelta, porque nunca hubo una transición de video de ida hacia el lote.

**Regla para el agente de IA:** nunca fusionar estos dos niveles en un solo componente.

## 9. Visor 360°

Si un lote tiene `image_360_url` no nula, la ficha técnica del lote debe ofrecer la opción de abrirlo en un visor 360° usando **Photo Sphere Viewer**.

```
components/showroom/
  └── Viewer360.tsx     → Wrapper de Photo Sphere Viewer, recibe image_360_url como prop
```

**Reglas:**

- Se monta solo bajo demanda, no se precarga junto con la ficha técnica.
- Debe mostrarse un estado de carga mientras la imagen panorámica se descarga.
- Si `image_360_url` es `null`, el botón/opción de 360° **no se renderiza en absoluto**.

## 10. Flujo de interacción completo (referencia)

```
Vista general — "front" (con feature hotspots: acceso, amenidad, caseta de ventas, "ver lotes", etc.)
  → click en botón de rotación → TransitionVideoPlayer reproduce front-to-rear.mp4 → Vista "rear" (sin hotspots de ningún tipo)
  → click en botón de rotación otra vez → TransitionVideoPlayer reproduce rear-to-front.mp4 → Vista "front"
  → click en feature hotspot con action='show_info' (ej. caseta de ventas) → se abre FeatureInfoPopover (sin video)
  → click en feature hotspot 'lots_overview', O click en el control dedicado de vista top → TransitionVideoPlayer reproduce front-to-top.mp4 → Vista "top" (hotspots de lote sobre grid de Photoshop)
  → click en toggle de grid → cambio instantáneo entre base_image_url y alt_image_url de 'top', hotspots de lote no se ven afectados
  → click en control de vista top otra vez (o "volver") → TransitionVideoPlayer reproduce top-to-front.mp4 → Vista "front"
  → click en hotspot de lote (solo disponible en "top") → se abre HotspotPreviewCard (fade-in de UI, sin video, sin cambio de render de fondo)
      → click en "Ver ficha completa" → navegación real a /lot/[id] (página indexable, con plano técnico y datos ampliados)
          → si el lote tiene image_360_url → opción "Ver en 360°" abre Viewer360 bajo demanda
          → botón "volver" → navegación normal de Next.js de regreso al showroom
      → cerrar el preview sin navegar → fade-out del modal, el render de fondo permanece igual
```

**Regla:** no existe el concepto de "reversa" en ningún punto de este flujo — cada cambio de vista siempre reproduce un clip de video hacia adelante, específico para ese sentido exacto. Si una tarea futura pidiera "un botón para deshacer/volver a la vista anterior con animación", la respuesta correcta es reproducir el clip correspondiente al sentido inverso ya existente en `view_transitions` (ej. `rear→front`), nunca intentar reproducir `front→rear` al revés.

## 11. Estrategia responsive (regla estricta — leer antes de tocar cualquier layout)

Este proyecto **no usa un enfoque responsive tradicional para el contenido visual del showroom.** Es una decisión de producto deliberada, no una limitación técnica a resolver "cuando haya tiempo".

**Lo que NUNCA se reajusta según el tamaño de pantalla:**

- El render (imagen fija o video de transición), en ninguna vista (`front`, `rear`, `top`).
- Las coordenadas de los hotspots (`lot_hotspots.hotspot_x`/`hotspot_y` en `top`, `feature_hotspots.hotspot_x`/`hotspot_y` en `front`) — el mismo porcentaje aplica sin importar el dispositivo.
- El visor 360° (Photo Sphere Viewer) — se muestra igual en mobile y desktop.

**Cómo se resuelve el mobile en su lugar:** el render mantiene su relación de aspecto y tamaño natural, y si no cabe en el viewport, el usuario lo recorre mediante **scroll/slider horizontal** — nunca escalando, recortando de forma inteligente, ni reposicionando el render o sus hotspots para "que quepa mejor".

```tsx
// Patrón de referencia — el contenedor del render se desplaza, el render y sus hotspots NUNCA se reescalan por breakpoint
<div className="overflow-x-auto md:overflow-x-visible">
  <div className="relative w-[1600px] md:w-full">
    {/* <img> con base_image_url en reposo, o <video> del TransitionVideoPlayer durante una transición */}
    {showHotspots &&
      lotHotspots.map((spot) => <Hotspot key={spot.lotId} x={spot.hotspotX} y={spot.hotspotY} />)}
  </div>
</div>
```

**Lo que SÍ se adapta según el tamaño de pantalla:**

- La **UI general de la página**: navbar, footer, paneles de ficha técnica, formularios del admin, tipografía de textos de interfaz, botones, menús.
- Las reglas normales de diseño responsive con Tailwind (`sm:`, `md:`, `lg:`) aplican con total libertad **únicamente a estos elementos de interfaz**, nunca al render ni a los hotspots.

**Regla para el agente de IA:** antes de agregar una clase responsive a cualquier elemento, verificar si ese elemento es parte del render/hotspots/visor 360° (no se toca) o parte de la UI de interfaz (se adapta con libertad). Ante la duda, preguntar antes de asumir.

---

**Última actualización:** 2026-09-24 · **Versión:** 3.3
