-- Migración 001: otorgar privilegios a service_role
-- Fecha: 2026-09-23
-- Contexto: los tests de integración local (PARC-111) y operaciones de servidor
-- legítimas usan SUPABASE_SERVICE_ROLE_KEY. Sin estos GRANT, service_role no puede
-- acceder a las tablas cuando "Automatically expose new tables" está desactivado
-- en Supabase (configuración recomendada de seguridad).
--
-- service_role bypass RLS por diseño; este GRANT solo le permite acceder a la
-- tabla en absoluto. RLS sigue siendo la última línea de defensa para anon/authenticated.

grant select on lots, views, view_transitions, lot_hotspots, feature_hotspots
  to service_role;

grant insert, update, delete on lots, views, view_transitions, lot_hotspots, feature_hotspots
  to service_role;
