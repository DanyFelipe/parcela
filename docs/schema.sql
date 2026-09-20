-- =============================================================================
-- SCHEMA.SQL — Showroom Inmobiliario (Plantilla Multi-Cliente)
-- =============================================================================
-- Ejecutar completo, en orden, en el SQL Editor de Supabase de CADA proyecto
-- cliente nuevo. Ver docs/ai-context/03-database.md para el razonamiento
-- detrás de cada decisión de este esquema — este archivo es la fuente de
-- verdad EJECUTABLE, ese documento es la fuente de verdad EXPLICADA.
--
-- Orden de creación respeta las dependencias de llaves foráneas:
-- lots, views (sin dependencias) → view_transitions, lot_hotspots,
-- feature_hotspots (dependen de las anteriores) → RLS → índices.
-- =============================================================================

-- =============================================================================
-- 1. LOTS — cada lote/parcela individual del terreno
-- =============================================================================
create table lots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric,
  status text not null check (status in ('available', 'reserved', 'sold')) default 'available',
  surface_area numeric,
  orientation text,
  image_360_url text,        -- NULLABLE. Si existe, el lote tiene visor 360° disponible.

  -- Campos de la ficha técnica ampliada (página completa /lot/[id])
  technical_plan_url text,
  soil_type text,
  has_water_service boolean not null default false,
  has_electricity_service boolean not null default false,
  has_sewage_service boolean not null default false,
  legal_status text check (legal_status in ('titled', 'in_process', 'not_titled')),
  encumbrances text,
  registry_number text,

  description text,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

comment on table lots is 'Cada lote/parcela individual del terreno, con su información comercial y ficha técnica ampliada.';

-- =============================================================================
-- 2. VIEWS — las vistas generales del terreno (front, rear, top)
-- =============================================================================
create table views (
  id text primary key,           -- 'front' | 'rear' | 'top'
  display_order integer not null,
  base_image_url text not null,  -- render fijo (D5 + Photoshop). En 'top', versión CON grid de lotes.
  alt_image_url text,            -- NULLABLE. Hoy solo usado por 'top': misma vista SIN el grid.
  created_at timestamp with time zone default now()
);

comment on table views is 'Vistas generales del terreno. Cada una es una imagen fija; no hay animación en reposo.';

-- =============================================================================
-- 3. VIEW_TRANSITIONS — clips de video que conectan dos vistas (una fila por sentido)
-- =============================================================================
create table view_transitions (
  id uuid primary key default gen_random_uuid(),
  from_view_id text not null references views(id),
  to_view_id text not null references views(id),
  video_url text not null,     -- MP4/WebM generado por IA, SIEMPRE reproducido hacia adelante
  created_at timestamp with time zone default now(),
  unique (from_view_id, to_view_id)
);

comment on table view_transitions is 'Clips de video por dirección entre dos vistas. Nunca se reproduce un clip en reversa: cada sentido tiene su propio archivo.';

-- =============================================================================
-- 4. LOT_HOTSPOTS — posición del marcador de cada lote, EXCLUSIVO de la vista 'top'
-- =============================================================================
create table lot_hotspots (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references lots(id) on delete cascade,
  view_id text not null references views(id) on delete restrict,
  hotspot_x numeric not null check (hotspot_x >= 0 and hotspot_x <= 100),
  hotspot_y numeric not null check (hotspot_y >= 0 and hotspot_y <= 100),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (lot_id, view_id)
);

comment on table lot_hotspots is 'Posición (%) del marcador clickeable de cada lote. En el modelo base, solo existen filas con view_id = ''top''.';

-- =============================================================================
-- 5. FEATURE_HOTSPOTS — marcadores especiales de puntos de interés (vista 'front')
-- =============================================================================
create table feature_hotspots (
  id uuid primary key default gen_random_uuid(),
  view_id text not null references views(id) on delete cascade,
  type text not null check (type in (
    'lots_overview',
    'natural_feature',
    'sales_office',
    'main_access',
    'amenity',
    'viewpoint',
    'future_phase'
  )),
  action text not null check (action in ('navigate_to_view', 'show_info')),
  target_view_id text references views(id),
  title text not null,
  description text,
  icon text,
  hotspot_x numeric not null check (hotspot_x >= 0 and hotspot_x <= 100),
  hotspot_y numeric not null check (hotspot_y >= 0 and hotspot_y <= 100),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table feature_hotspots is 'Marcadores de puntos de interés generales del terreno (no representan lotes). Viven principalmente en la vista front.';

-- =============================================================================
-- 6. ROW LEVEL SECURITY — lectura pública, escritura solo autenticada
-- =============================================================================

alter table lots enable row level security;
alter table views enable row level security;
alter table view_transitions enable row level security;
alter table lot_hotspots enable row level security;
alter table feature_hotspots enable row level security;

-- Lectura pública (el showroom es visible sin login)
create policy "Public read access to lots" on lots for select using (true);
create policy "Public read access to views" on views for select using (true);
create policy "Public read access to view_transitions" on view_transitions for select using (true);
create policy "Public read access to lot_hotspots" on lot_hotspots for select using (true);
create policy "Public read access to feature_hotspots" on feature_hotspots for select using (true);

-- Escritura solo para usuarios autenticados (equipo de ventas / admin)
-- NOTA: en la fase actual del proyecto, la carga de datos es manual vía SQL Editor
-- (con las credenciales del proyecto, que no pasan por estas políticas). Estas
-- políticas ya quedan listas para cuando exista el CRUD autenticado en /admin.
create policy "Authenticated users can update lots" on lots for update using (auth.role() = 'authenticated');
create policy "Authenticated users can insert lots" on lots for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete lots" on lots for delete using (auth.role() = 'authenticated');

create policy "Authenticated users can manage views" on views for all using (auth.role() = 'authenticated');
create policy "Authenticated users can manage view_transitions" on view_transitions for all using (auth.role() = 'authenticated');
create policy "Authenticated users can manage lot_hotspots" on lot_hotspots for all using (auth.role() = 'authenticated');
create policy "Authenticated users can manage feature_hotspots" on feature_hotspots for all using (auth.role() = 'authenticated');

-- =============================================================================
-- 6.1. GRANTS EXPLÍCITOS PARA LA DATA API
-- =============================================================================
-- Necesario si en el proyecto de Supabase la opción "Automatically expose new
-- tables" está desactivada (recomendado por seguridad — ver docs/SETUP.md).
-- Sin estos GRANT, PostgREST no puede servir estas tablas aunque RLS esté bien
-- configurada: RLS decide QUÉ filas puede ver/tocar un rol, GRANT decide SI
-- ese rol puede acceder a la tabla en absoluto. Ambos son necesarios juntos.
grant select on lots, views, view_transitions, lot_hotspots, feature_hotspots
  to anon, authenticated;

grant insert, update, delete on lots, views, view_transitions, lot_hotspots, feature_hotspots
  to authenticated;

-- =============================================================================
-- 7. ÍNDICES
-- =============================================================================
create index idx_lot_hotspots_view_id on lot_hotspots(view_id);
create index idx_lot_hotspots_lot_id on lot_hotspots(lot_id);
create index idx_feature_hotspots_view_id on feature_hotspots(view_id);
create index idx_lots_status on lots(status);

-- =============================================================================
-- 8. SEED MÍNIMO DE VISTAS (referencia — ajustar URLs reales por cliente)
-- =============================================================================
-- Descomentar y completar con las URLs reales del cliente antes de ejecutar,
-- o cargar estas filas por separado una vez que los assets estén subidos al storage.
--
-- insert into views (id, display_order, base_image_url, alt_image_url) values
--   ('front', 1, 'https://.../front-base.webp', null),
--   ('rear',  2, 'https://.../rear-base.webp', null),
--   ('top',   3, 'https://.../top-with-grid.webp', 'https://.../top-no-grid.webp');
--
-- insert into view_transitions (from_view_id, to_view_id, video_url) values
--   ('front', 'rear', 'https://.../front-to-rear.mp4'),
--   ('rear', 'front', 'https://.../rear-to-front.mp4'),
--   ('front', 'top', 'https://.../front-to-top.mp4'),
--   ('top', 'front', 'https://.../top-to-front.mp4');

-- =============================================================================
-- FIN DEL SCHEMA
-- =============================================================================
