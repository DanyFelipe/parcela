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
