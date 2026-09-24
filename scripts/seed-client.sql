-- PARC-101: Seed mínimo de vistas para desarrollo.
-- Ejecutar después de docs/schema.sql en el SQL Editor de Supabase.
-- ON CONFLICT DO NOTHING evita duplicados y no sobrescribe assets reales.

insert into views (id, display_order, base_image_url, alt_image_url)
values
  (
    'front',
    1,
    'https://placehold.co/1920x1080/webp?text=Parcela+Front',
    null
  ),
  (
    'rear',
    2,
    'https://placehold.co/1920x1080/webp?text=Parcela+Rear',
    null
  ),
  (
    'top',
    3,
    'https://placehold.co/1920x1080/webp?text=Parcela+Top+Grid',
    'https://placehold.co/1920x1080/webp?text=Parcela+Top+Sin+Grid'
  )
on conflict (id) do nothing;

-- Verificación: debe devolver front, rear y top en ese orden.
select id, display_order, base_image_url, alt_image_url
from views
where id in ('front', 'rear', 'top')
order by display_order;

-- Verificación: debe devolver 3.
select count(*) as seeded_view_count
from views
where id in ('front', 'rear', 'top');

-- PARC-107: Seed mínimo de clips de transición para desarrollo.
-- Reemplazar estas URLs por los assets reales antes de un despliegue.
-- La gráfica válida no incluye transiciones directas entre rear y top.

insert into view_transitions (from_view_id, to_view_id, video_url)
values
  (
    'front',
    'rear',
    'https://example.com/parcela/transitions/front-to-rear.mp4'
  ),
  (
    'rear',
    'front',
    'https://example.com/parcela/transitions/rear-to-front.mp4'
  ),
  (
    'front',
    'top',
    'https://example.com/parcela/transitions/front-to-top.mp4'
  ),
  (
    'top',
    'front',
    'https://example.com/parcela/transitions/top-to-front.mp4'
  )
on conflict (from_view_id, to_view_id) do nothing;

-- Verificación: debe devolver 4 y ningún resultado con rear/top en cualquier sentido.
select from_view_id, to_view_id, video_url
from view_transitions
where (from_view_id, to_view_id) in (
  ('front', 'rear'),
  ('rear', 'front'),
  ('front', 'top'),
  ('top', 'front')
)
order by from_view_id, to_view_id;

select count(*) as seeded_transition_count
from view_transitions
where (from_view_id, to_view_id) in (
  ('front', 'rear'),
  ('rear', 'front'),
  ('front', 'top'),
  ('top', 'front')
);

select count(*) as forbidden_transition_count
from view_transitions
where (from_view_id, to_view_id) in (
  ('rear', 'top'),
  ('top', 'rear')
);

-- PARC-201: Seed de lotes de prueba para desarrollo.
-- IDs fijos para que el seed sea idempotente (on conflict do nothing).
-- Reemplazar datos y URLs por los reales del cliente antes de un despliegue.

insert into lots (
  id,
  name,
  price,
  status,
  surface_area,
  orientation,
  image_360_url,
  technical_plan_url,
  soil_type,
  has_water_service,
  has_electricity_service,
  has_sewage_service,
  legal_status,
  encumbrances,
  registry_number,
  description
)
values
  (
    'd9b0fe21-c5b1-4b4d-acae-e4986597b4c7'::uuid,
    'Lote A-01',
    68000,
    'available',
    450,
    'Norte',
    'https://placehold.co/1200x600/webp?text=360+Lote+A-01',
    'https://placehold.co/800x800/webp?text=Plano+A-01',
    'Franco',
    true,
    true,
    true,
    'titled',
    null,
    'REG-2026-A-01',
    'Lote esquinero con acceso directo y vista abierta.'
  ),
  (
    '02cf3efd-7c5f-4a7b-a41c-3e0e71e920f8'::uuid,
    'Lote A-02',
    75000,
    'available',
    520,
    'Este',
    null,
    'https://placehold.co/800x800/webp?text=Plano+A-02',
    'Franco-arenoso',
    true,
    true,
    false,
    'titled',
    null,
    'REG-2026-A-02',
    'Lote amplio con orientación matutina y buena iluminación natural.'
  ),
  (
    'c714c229-cff7-416e-bd99-6acdf6a2df61'::uuid,
    'Lote A-03',
    72000,
    'reserved',
    480,
    'Sur',
    null,
    'https://placehold.co/800x800/webp?text=Plano+A-03',
    'Arcilloso',
    true,
    false,
    false,
    'in_process',
    'Reserva con opción de compra vigente.',
    'REG-2026-A-03',
    'Lote en proceso de escrituración, ubicado cerca del acceso principal.'
  ),
  (
    '0f21566e-12d9-4709-af2e-5952bbbc5173'::uuid,
    'Lote A-04',
    88000,
    'available',
    600,
    'Oeste',
    'https://placehold.co/1200x600/webp?text=360+Lote+A-04',
    'https://placehold.co/800x800/webp?text=Plano+A-04',
    'Franco',
    true,
    true,
    true,
    'titled',
    null,
    'REG-2026-A-04',
    'Lote de mayor superficie, ideal para proyecto familiar o doble vivienda.'
  ),
  (
    '2a2ea9b0-a33e-4b73-9723-781278a205f1'::uuid,
    'Lote A-05',
    65000,
    'sold',
    410,
    'Norte',
    null,
    'https://placehold.co/800x800/webp?text=Plano+A-05',
    'Arenoso',
    false,
    false,
    false,
    'titled',
    null,
    'REG-2026-A-05',
    'Lote vendido. Referencia de precio histórico para comparativas.'
  ),
  (
    '1b55d5f4-f553-4d5d-8d40-847e55dc1c17'::uuid,
    'Lote A-06',
    82000,
    'available',
    550,
    'Este',
    'https://placehold.co/1200x600/webp?text=360+Lote+A-06',
    'https://placehold.co/800x800/webp?text=Plano+A-06',
    'Franco-arcilloso',
    false,
    true,
    true,
    'in_process',
    null,
    'REG-2026-A-06',
    'Lote con servicios eléctricos y sanitarios, agua en proyecto.'
  )
on conflict (id) do nothing;

-- Verificación: debe devolver 6 lotes.
select count(*) as seeded_lot_count
from lots
where id in (
  'd9b0fe21-c5b1-4b4d-acae-e4986597b4c7'::uuid,
  '02cf3efd-7c5f-4a7b-a41c-3e0e71e920f8'::uuid,
  'c714c229-cff7-416e-bd99-6acdf6a2df61'::uuid,
  '0f21566e-12d9-4709-af2e-5952bbbc5173'::uuid,
  '2a2ea9b0-a33e-4b73-9723-781278a205f1'::uuid,
  '1b55d5f4-f553-4d5d-8d40-847e55dc1c17'::uuid
);

-- Verificación: distribución de estados (mínimo: available, reserved, sold).
select status, count(*) as lot_count
from lots
where id in (
  'd9b0fe21-c5b1-4b4d-acae-e4986597b4c7'::uuid,
  '02cf3efd-7c5f-4a7b-a41c-3e0e71e920f8'::uuid,
  'c714c229-cff7-416e-bd99-6acdf6a2df61'::uuid,
  '0f21566e-12d9-4709-af2e-5952bbbc5173'::uuid,
  '2a2ea9b0-a33e-4b73-9723-781278a205f1'::uuid,
  '1b55d5f4-f553-4d5d-8d40-847e55dc1c17'::uuid
)
group by status
order by status;
