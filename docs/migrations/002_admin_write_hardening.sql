-- Migración 002: endurecer escritura del panel admin (PARC-B01 / PARC-B02)
-- Fecha: 2026-10-09
-- Contexto: en Supabase, los usuarios anónimos (Auth "anonymous sign-ins") tienen
-- rol `authenticated`. Con las políticas originales podían crear, editar y borrar
-- lotes sin ser administradores. Esta migración exige además que el JWT no sea
-- anónimo. La defensa en la aplicación (requireAdminContext en app/admin/actions.ts)
-- replica la misma regla; RLS sigue siendo la última línea de defensa.
--
-- Requisito de configuración: en Supabase → Authentication → Sign In / Providers,
-- desactivar "Allow anonymous sign-ins" y "Allow new users to sign up".

drop policy if exists "Authenticated users can update lots" on lots;
drop policy if exists "Authenticated users can insert lots" on lots;
drop policy if exists "Authenticated users can delete lots" on lots;
drop policy if exists "Authenticated users can manage lot_hotspots" on lot_hotspots;

create policy "Authenticated users can update lots" on lots
  for update
  using (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  )
  with check (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  );

create policy "Authenticated users can insert lots" on lots
  for insert
  with check (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  );

create policy "Authenticated users can delete lots" on lots
  for delete
  using (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  );

create policy "Authenticated users can manage lot_hotspots" on lot_hotspots
  for all
  using (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  )
  with check (
    (select auth.role()) = 'authenticated'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') <> 'true'
  );
