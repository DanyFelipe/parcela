# Tests de integración (opt-in)

Capa de verificación de `docs/ai-context/DEVELOPMENT-PLAN.md` ("Estrategia única de
verificación externa"). Se ejecutan explícitamente — nunca los recoge `pnpm test`
(Vitest unitario = `tests/unit/`) ni Playwright (E2E = `tests/e2e/`):

```bash
pnpm test:integration
```

## Convenciones (obligatorias)

- **Requieren credenciales reales** desde `.env.local` (Supabase, Vercel Blob/R2).
  El runner las carga automáticamente (`vitest.integration.config.ts`).
- **Nunca imprimir secretos** (tokens, URL firmadas) en asserts, logs o nombres de tests.
- **Limpiar lo que creen**: cualquier fila o asset de prueba debe eliminarse al final
  (ej. `afterAll`), tanto en Supabase como en storage.
- **Sin datos de producción**: usar IDs/`clientId` de prueba claramente identificados.
- Un test de integración demuestra conexión/contrato real — no sustituye al unitario
  (SDK mockeado) ni al E2E (flujo completo), y viceversa.

## Skeleton

Los smoke tests formales del ticket **PARC-111** ya están aquí:
`supabase.smoke.test.ts` (lectura pública, RLS activo, escritura con service_role +
limpieza) y `vercel-blob.smoke.test.ts` (subir → resolver URL → HEAD → eliminar asset
temporal). Agregar nuevos archivos `*.test.ts` siguiendo las convenciones anteriores.
