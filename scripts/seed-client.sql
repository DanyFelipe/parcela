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
