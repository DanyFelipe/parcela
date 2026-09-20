# 03 — Base de Datos (Supabase)

> Ver [`00-INDEX.md`](./00-INDEX.md) para las reglas generales.

## Reglas específicas de este documento

1. **`docs/schema.sql` es la única fuente de verdad del esquema real.** Si ese archivo no está disponible en el contexto actual o parece desactualizado respecto al código, el agente debe pedir confirmación del esquema antes de escribir cualquier query — nunca inferir nombres de columnas a partir del nombre de una variable o de un patrón "típico".
2. **Ningún agente de IA desactiva Row Level Security (RLS) "para simplificar" o "para probar más rápido".** Si una tarea parece requerir desactivar RLS, es señal de que la política está mal diseñada — se corrige la política, no se apaga la protección.
3. **Cualquier cambio de política RLS debe mostrarse explícitamente al usuario para revisión antes de aplicarse.** Es un cambio de seguridad, no un cambio de código trivial.
4. `SUPABASE_SERVICE_ROLE_KEY` nunca se usa desde código que corra en el navegador, ni se expone en una variable `NEXT_PUBLIC_*`.

---

## 1. Modelo de datos (referencia — el real vive en `docs/schema.sql`)

**Nota de idioma:** el esquema de base de datos se define completamente en **inglés** (tablas, columnas), consistente con la regla de `04-coding-standards.md` de que todo lo técnico va en inglés. El español se reserva para contenido visible al usuario final (labels de UI, textos, mensajes), nunca para nombres de tablas/columnas.

**Nombres de vistas del terreno (valores fijos de `views.id`):** `front`, `rear`, `top` — ver justificación de naming en `02-architecture.md`, sección 6.

```sql
create table lots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  status text check (status in ('available', 'reserved', 'sold')) default 'available',
  surface_area numeric,
  orientation text,
  image_360_url text,        -- NULLABLE. Si existe, el lote tiene visor 360° disponible en su ficha técnica

  -- Campos de la ficha técnica ampliada (página completa /lot/[id], no del modal rápido de preview)
  technical_plan_url text,          -- NULLABLE. Imagen del plano técnico/mensura del lote
  soil_type text,                   -- ej. "arcilloso", "arenoso" — dato relevante en loteos
  has_water_service boolean default false,
  has_electricity_service boolean default false,
  has_sewage_service boolean default false,
  legal_status text check (legal_status in ('titled', 'in_process', 'not_titled')),  -- estado legal/escritura
  encumbrances text,                -- NULLABLE. Gravámenes existentes (hipoteca, servidumbre, etc.), texto libre
  registry_number text,             -- NULLABLE. Folio real / matrícula / número de inscripción registral

  description text,
  updated_at timestamp default now(),
  updated_by uuid references auth.users(id),
  created_at timestamp default now()
);

create table views (
  id text primary key,           -- 'front' | 'rear' | 'top'
  display_order integer not null,
  base_image_url text not null,  -- el render fijo (D5 + Photoshop) de esta vista. SIEMPRE existe, es una imagen estática.
  alt_image_url text,            -- NULLABLE. Variante alternativa del mismo encuadre (hoy solo usado por 'top': versión SIN el grid de división de lotes)
  created_at timestamp default now()
);

create table view_transitions (
  id uuid primary key default gen_random_uuid(),
  from_view_id text not null references views(id),
  to_view_id text not null references views(id),
  video_url text not null,     -- clip de video (MP4/WebM) generado por IA, SIEMPRE reproducido hacia adelante
  created_at timestamp default now(),
  unique (from_view_id, to_view_id)
);

-- Tabla de relación normalizada: un lote tiene su hotspot posicionado en la vista 'top' (vista aérea).
-- Ya NO se usa para 'front' — ver nota tras el bloque SQL sobre el cambio de alcance.
-- Se mantiene el diseño lote+vista (en vez de columnas fijas hotspot_x/hotspot_y) por si en el futuro
-- se agrega otra vista con hotspots de lote individual.
create table lot_hotspots (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  view_id text not null references views(id) on delete restrict,
  hotspot_x numeric not null check (hotspot_x >= 0 and hotspot_x <= 100),
  hotspot_y numeric not null check (hotspot_y >= 0 and hotspot_y <= 100),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (lot_id, view_id)
);

create index idx_lot_hotspots_view_id on lot_hotspots(view_id);

-- Marcadores especiales de puntos de interés del terreno (NO representan lotes individuales).
-- Viven en la vista 'front' — reemplazan ahí los antiguos hotspots de lote, que ahora
-- son exclusivos de 'top' (ver nota tras este bloque).
create table feature_hotspots (
  id uuid primary key default gen_random_uuid(),
  view_id text not null references views(id) on delete cascade,
  type text not null check (type in (
    'lots_overview',      -- "Ver lotes" — lleva a la vista top
    'natural_feature',    -- bosque, río, laguna, etc. — muestra info
    'sales_office',       -- caseta de ventas — muestra info
    'main_access',        -- portón/acceso principal — muestra info
    'amenity',            -- piscina, quincho, cancha, club house — muestra info
    'viewpoint',          -- mirador / vista panorámica — muestra info
    'future_phase'        -- próxima etapa del proyecto — muestra info
  )),
  action text not null check (action in ('navigate_to_view', 'show_info')),
  target_view_id text references views(id),  -- solo aplica si action = 'navigate_to_view' (ej. 'top')
  title text not null,
  description text,
  icon text,              -- nombre de ícono (ej. de lucide-react) para representar el tipo visualmente
  hotspot_x numeric not null check (hotspot_x >= 0 and hotspot_x <= 100),
  hotspot_y numeric not null check (hotspot_y >= 0 and hotspot_y <= 100),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create index idx_feature_hotspots_view_id on feature_hotspots(view_id);
```

**Cambio de alcance de `lot_hotspots` (importante, revierte una decisión anterior):** los hotspots de lote individual ahora son **exclusivos de la vista `top`**. La vista `front` ya no lleva hotspots por lote — en su lugar usa `feature_hotspots` con `type = 'lots_overview'` como punto de entrada hacia `top`, donde el usuario navega y clickea el lote específico con precisión. Esto resuelve un problema real de UX: en perspectiva, los lotes lejanos se ven pequeños y apretados, dificultando el click preciso; la vista aérea no tiene ese problema porque la proyección es uniforme.

**Regla para el agente de IA:** `action = 'navigate_to_view'` solo se usa con `type = 'lots_overview'` en el modelo base (llevando a `top`); los demás tipos siempre usan `action = 'show_info'`, desplegando un panel simple con `title`/`description`/`icon`. No mezclar ambos comportamientos en un mismo `type`.

**Modelo de contenido visual (fundamental, no reinterpretar):** cada vista (`front`, `rear`, `top`) es una **imagen fija única** (`base_image_url`), producida en D5 Render y retocada en Photoshop — no hay ninguna animación en reposo (sin loops de viento, agua, ni "vida" en la imagen). La **única** animación que existe en todo el producto es la de `view_transitions`: un **clip de video real** generado por IA que conecta el render fijo de una vista con el render fijo de otra. Fuera de esas transiciones, lo que el usuario ve siempre es una imagen estática.

**Modelo de transición: video, no secuencia de frames, y sin reversa (cambio importante respecto a versiones anteriores de este documento).** Cada dirección de cambio entre dos vistas es su **propio clip de video independiente** — `front→rear` y `rear→front` son dos filas distintas con dos videos distintos, cada uno reproducido siempre hacia adelante (`play()`). No existe reversa en ningún punto del sistema, ni de video ni de frames. Ver el razonamiento técnico completo y el contrato `TransitionPlayer` en `02-architecture.md`, sección 5.

**Decisión descartada (para que un agente no la reintroduzca — dos decisiones distintas):**

1. _Loop idle en reposo:_ se evaluó un campo `idle_sequence` para dar un loop animado sutil a cada vista en reposo (viento, agua, nubes), pero se descartó — el contenido del proyecto es terrenos/loteos, sin elementos que justifiquen ese movimiento ni el costo adicional de generarlo.
2. _Secuencia de frames en Canvas para las transiciones:_ se evaluó representar cada transición como una secuencia de frames individuales (`SequenceManifest`, reproducida en `<canvas>` con reversa soportada), pero se descartó porque el requisito real de interacción es "reproducir el clip completo al hacer click" (no scrubbing/arrastre continuo), y generar un clip de video independiente por cada dirección es más simple de implementar, más liviano en peso (compresión real de video vs. frames sueltos), y evita toda la complejidad de reversa de frames o de `playbackRate` negativo en `<video>`. Si en el futuro un requisito de producto pidiera scrubbing interactivo real, se implementa una alternativa que cumpla el mismo contrato `TransitionPlayer`, sin rediseñar el resto del sistema.

**Nota sobre los campos de ficha ampliada:** este set (plano técnico, tipo de suelo, servicios básicos, estado legal, gravámenes, número de registro) es un punto de partida estándar para loteos — **ajustar según lo que cada cliente/mercado inmobiliario específico requiera legalmente mostrar**, ya que las normativas de información al comprador varían por país. `legal_status` usa un `check` con valores fijos (`titled` = con escritura, `in_process` = en trámite, `not_titled` = sin titular) para que sea un dato consultable/filtrable, no texto libre — si se necesita más granularidad, se amplía el `check` con nuevos valores vía migración, no se convierte en texto libre.

**Regla para el agente de IA:** los campos de servicios (`has_water_service`, `has_electricity_service`, `has_sewage_service`) son booleanos independientes, no un campo de texto tipo `"agua, luz"` — esto permite filtrar/consultar lotes por disponibilidad de servicios de forma confiable. Si se necesita un servicio adicional (ej. gas), se agrega como columna booleana nueva vía migración, no se mete dentro de un campo de texto existente.

**Toggle de grid en la vista top (`alt_image_url`):** la vista `top` tiene dos variantes del mismo encuadre exacto, generadas en post-producción — `base_image_url` (con el grid de división de lotes dibujado en Photoshop, mostrado por defecto) y `alt_image_url` (el mismo render, sin el grid). Un botón de UI ("Mostrar/ocultar divisiones") alterna cuál de las dos imágenes se muestra — es un cambio instantáneo de `<img src>`, sin animación de video ni lógica de transición, porque es el mismo momento/cámara, solo con o sin una capa gráfica de post-producción. Los hotspots de lote no se ven afectados por este toggle — su posición es la misma en ambas variantes, ya que el encuadre es idéntico. `alt_image_url` es genérico en el esquema (no se llama `top_no_grid_url`) por si en el futuro otra vista necesita una variante alternativa por un motivo distinto — hoy solo `top` la usa.

**Nota de auditoría:** el campo `updated_by` referencia al usuario de Supabase Auth que hizo el último cambio — esto es lo mínimo esperable de un panel administrativo profesional (saber quién cambió qué). Si el proyecto requiere un historial completo de cambios (no solo el último), se debe evaluar una tabla `lots_history` como mejora futura, no asumirla como ya implementada.

**Nota sobre `image_360_url`:** este campo es opcional a propósito — no todos los lotes tendrán una captura 360°. El componente de ficha técnica (ver `02-architecture.md`) debe verificar su existencia antes de ofrecer la opción "Ver en 360°"; nunca asumir que el campo siempre viene con valor.

**Decisión de producto que elimina un campo (importante para que un agente no lo reintroduzca):** `lots` **no tiene** una columna de tipo `entry_sequence`/`transition_sequence`. Se evaluó generar una animación de transición individual por cada lote (terreno general → detalle del lote), pero se descartó por inviabilidad de costos y tiempo de generación IA a escala (sería una secuencia distinta por cada lote del proyecto). La única animación de cambio de perspectiva que existe en el producto es la rotación del terreno general (`view_transitions`, sección siguiente). Hacer click en un hotspot abre un preview rápido de UI (sin reproducir ningún video de transición); ver el patrón completo de dos niveles (preview + página completa indexable) en `02-architecture.md`, sección 7.

**Historial de esta decisión (para que un agente no reintroduzca un diseño ya descartado):** el diseño de `lot_hotspots` como tabla de relación (en vez de columnas `hotspot_x`/`hotspot_y` fijas en `lots`) se mantuvo incluso después de que los hotspots de lote pasaran a ser exclusivos de `top` — se conserva la forma relacional por si en el futuro se agrega otra vista con hotspots de lote individual, evitando así tener que rediseñar el esquema otra vez. La razón original de por qué no bastaban columnas únicas en `lots` (coordenadas distintas por vista, ya que las perspectivas no comparten la misma posición) sigue aplicando como justificación de diseño, aunque hoy solo exista una vista (`top`) usando la tabla.

## 2. Políticas de Row Level Security (referencia)

```sql
alter table lots enable row level security;

-- Public read (showroom visible sin login)
create policy "Public read access to lots"
  on lots for select
  using (true);

-- Solo usuarios autenticados pueden modificar
create policy "Authenticated sales users can update"
  on lots for update
  using (auth.role() = 'authenticated');

-- Insertar/eliminar lotes: mismo criterio, evaluar si se requiere un rol más restrictivo
-- (ej. tabla de roles) si en el futuro hay múltiples niveles de permiso.
```

**Regla:** si un cliente requiere múltiples niveles de permiso (ej. "vendedor" solo edita precio/estado, "admin" también sube renders nuevos), esto se modela con una tabla de roles adicional y políticas específicas por operación — no se resuelve en el código de la aplicación como única barrera.

## 3. Dos clientes, dos contextos (no mezclar)

| Cliente                  | Ubicación                         | Uso                                                                                                     |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `lib/supabase/client.ts` | Componentes `'use client'`        | Lectura pública del showroom desde el navegador cuando aplique; usa `anon key`, protegido por RLS       |
| `lib/supabase/server.ts` | Server Components, Server Actions | Lecturas server-side del showroom (preferido, mejor performance) y todas las escrituras del panel admin |

**Regla:** las escrituras (`insert`/`update`/`delete`) **siempre** pasan por una Server Action (ver `02-architecture.md`, sección 3), nunca directamente desde un componente cliente, incluso si RLS técnicamente lo permitiría. Esto centraliza la validación Zod y el registro de auditoría.

## 4. Convenciones de nombres

- Tablas y columnas en `snake_case`, en **inglés**, consistente con lo ya definido en `docs/schema.sql` y con la regla general de `04-coding-standards.md` de que todo lo técnico va en inglés.
- Claves foráneas nombradas `<tabla_singular>_id` (ej. `lot_id`, `view_id` — no `id_lot` ni `lotId`).
- Timestamps: `created_at`, `updated_at` — nombres estándar, no variantes.
- Valores de datos de negocio (contenido dentro de las filas, como el nombre de un lote o su descripción) sí pueden estar en español, porque son contenido, no estructura — la distinción es: **estructura del esquema = inglés, contenido de las filas = el idioma del cliente final**.

## 5. Migraciones

- Todo cambio de esquema se escribe como un archivo SQL versionado (ej. `docs/migrations/003_add_reservation_date.sql`), no se aplica solo manualmente desde el dashboard de Supabase sin dejar rastro en el repositorio.
- Un agente de IA que proponga un cambio de esquema debe generar el archivo de migración correspondiente, no solo instrucciones verbales de qué click hacer en el dashboard.

## 6. Checklist antes de escribir una query o mutación nueva

- [ ] ¿Confirmé el nombre real de la tabla/columna contra `docs/schema.sql`, en vez de asumirlo?
- [ ] Si es una escritura, ¿pasa por una Server Action con validación Zod?
- [ ] ¿La política RLS relevante ya cubre este caso, o necesito señalar al usuario que falta una política?
- [ ] Si agregué una columna o tabla, ¿generé el archivo de migración correspondiente?

---

**Última actualización:** 2026-09-16 · **Versión:** 1.7
