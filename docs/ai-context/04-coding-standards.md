# 04 — Estándares de Código y Calidad

> Ver [`00-INDEX.md`](./00-INDEX.md) para las reglas generales.

## Reglas específicas de este documento

1. Todo código nuevo se escribe en **TypeScript estricto**. `any` solo se acepta temporalmente con comentario `// TODO: tipar` y debe resolverse antes de mergear a la rama principal.
2. Ningún commit se hace sin pasar lint, formato y tests relevantes — esto lo hacen cumplir Husky + lint-staged automáticamente, pero un agente de IA no debe sugerir `--no-verify` para saltarse el hook salvo emergencia explícitamente autorizada por el usuario.
3. Si una tarea afecta el flujo crítico (rotación, transición a lote, vuelta), debe acompañarse de al menos una prueba (unitaria o E2E) que lo cubra.
4. Un agente de IA **nunca ejecuta `git commit` ni `git push` de forma autónoma** — el usuario revisa y aprueba cada lote de cambios antes de que se commitee (flujo completo en la sección 2).

---

## 1. Idioma y naming

- **Código** (variables, funciones, componentes, nombres de archivo): **inglés**, estándar de la industria.
- **Contenido de negocio** (labels visibles, textos, mensajes de error al usuario): **español**.
- **Base de datos**: ver `03-database.md` — español, `snake_case`.
- Componentes React: `PascalCase.tsx`, un componente principal por archivo.
- Hooks personalizados: `useAlgo.ts`.
- Server Actions: siempre en inglés, verbo + sustantivo (`updateLot`, `fetchTransitionVideoUrl`) — sin excepción. No existe una categoría de "nombre de negocio" que se salte esta regla; el idioma español se reserva exclusivamente para contenido de datos y UI, nunca para identificadores de código.

## 2. Estructura de commits (Conventional Commits)

```
feat: agregar reproductor de video con precarga
fix: corregir manejo de error de carga en TransitionVideoPlayer
refactor: extraer lógica de resolución de video de transición a hook useTransitionVideo
docs: actualizar 03-database.md con tabla de auditoría
test: agregar E2E para flujo rotación → lote → volver
chore: actualizar dependencias de dev
```

**Regla:** un agente de IA que genere commits debe usar este formato. El cuerpo del commit (si aplica) explica el _por qué_, no repite el _qué_ ya dicho en el título.

### 2.1. Flujo de aprobación de commits (obligatorio para agentes de IA)

**El usuario revisa y aprueba cada commit antes de que exista.** El agente no decide por su cuenta cuándo commitear:

1. El agente implementa los cambios y ejecuta los quality gates (sección 7).
2. El agente presenta al usuario un resumen claro de lo cambiado (archivos, propósito) y deja el diff disponible para revisión — sin ejecutar `git commit`.
3. El usuario revisa por su cuenta el código nuevo/lo cambiado y, si está de acuerdo, pide explícitamente: "haz el commit" (y, cuando corresponda, "haz el push").
4. Solo tras esa orden, el agente ejecuta `git commit` / `git push` con el mensaje acordado.

**Si después de la aprobación el agente realiza cambios adicionales, el lote vuelve al paso 2** — la aprobación cubre lo que el usuario vio, no lo que cambió después. Excepción: el hook pre-commit de Husky puede modificar archivos al formatearlos dentro del commit aprobado; eso no requiere reaprobación.

## 3. Testing

| Tipo        | Herramienta                    | Cuándo es obligatorio                                                                                                                |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Unitario    | Vitest + React Testing Library | Lógica de negocio pura (validaciones, resolución de qué clip de transición corresponde según vista actual/destino, store de Zustand) |
| Componentes | React Testing Library          | Componentes con lógica condicional relevante (ej. `Hotspot` según estado del lote)                                                   |
| End-to-end  | Playwright                     | Flujo completo: carga vista general → rotación → click lote → transición → detalle → volver                                          |

### 3.1. Convenciones de ejecución y ubicación

- Los tests unitarios y de componentes viven en `tests/unit/` y usan los patrones `*.test.ts` o `*.test.tsx`.
- `pnpm test` ejecuta Vitest y solo descubre tests dentro de `tests/unit/`.
- Los tests E2E viven en `tests/e2e/` y se ejecutan por separado con `pnpm exec playwright test`.
- Vitest no debe recoger archivos de Playwright: ambos runners tienen responsabilidades y APIs incompatibles.
- Un test unitario debe verificar una unidad aislada y determinista; un test E2E debe verificar un flujo observable desde el navegador.

**Regla:** un cambio que toque `TransitionVideoPlayer`, el `showroom.store.ts`, o cualquier Server Action de `admin/actions.ts` no se considera "terminado" sin al menos una prueba que lo respalde, salvo que el usuario explícitamente indique que es un prototipo descartable.

## 4. Manejo de errores

- Toda Server Action debe capturar errores de Supabase y devolver un mensaje entendible para la UI, no propagar el error crudo de Postgres al usuario final.
- Errores no manejados en producción deben llegar a **Sentry** (ver `01-stack-and-infra.md`) — no basta con un `console.error`.
- El `TransitionVideoPlayer` debe manejar el caso de un clip de video que falla al cargar (red lenta, 404) sin dejar la interfaz en un estado roto — degradar visualmente (ej. saltar directo a mostrar el `base_image_url` de la vista de destino) en vez de mostrar una pantalla congelada o un error visible al usuario.

```typescript
// Ejemplo de manejo de error esperado en una Server Action
export async function updateLot(lotId: string, changes: unknown) {
  try {
    const parsed = lotUpdateSchema.parse(changes);
    const supabase = createServerClient();
    const { error } = await supabase.from('lots').update(parsed).eq('id', lotId);
    if (error) throw error;
  } catch (err) {
    // Log a Sentry con contexto, pero devolver mensaje seguro a la UI
    console.error('Error updating lot', { lotId, err });
    throw new Error('No se pudo actualizar el lote. Intenta nuevamente.');
  }
}
```

## 5. Accesibilidad (mínimo esperado)

- Todo elemento interactivo (hotspot, botón de rotación, botón "volver") debe ser alcanzable por teclado (`tabIndex`, `onKeyDown` donde `onClick` no baste) y tener un `aria-label` descriptivo — un hotspot sobre un render no es auto-explicativo para un lector de pantalla sin él.
- Contraste de texto sobre imágenes de render: mínimo AA de WCAG en cualquier texto superpuesto (precio, nombre de lote), lo cual casi siempre implica un scrim/overlay semitransparente detrás del texto.
- Respetar `prefers-reduced-motion`: si el usuario lo tiene activado, el cambio de vista debe poder saltar directamente a mostrar el `base_image_url` de la vista de destino en vez de forzar la reproducción completa del clip de transición.

## 6. Performance en código (no solo en assets)

- El `TransitionVideoPlayer` reproduce el `<video>` de forma nativa (`.play()`) — no hay bucle manual de `requestAnimationFrame` que gestionar, el navegador se encarga de decodificar y pintar el video.
- Los clips de video deben precargarse (`preload="auto"`) apenas el usuario entra a una vista desde la que puede disparar esa transición (ej. al mostrar `front`, precargar `front→rear` y `front→top` en segundo plano), no recién al hacer click — esto evita un salto perceptible al iniciar la reproducción.
- Evitar recalcular el manifest o volver a pedir datos a Supabase en cada render de componente — usar cache/memoización donde el patrón de Next.js (Server Components, `fetch` con revalidación) lo permita naturalmente.

## 7. Checklist de calidad antes de dar por terminada una tarea

- [ ] TypeScript estricto, sin `any` sin justificar con `// TODO`.
- [ ] `pnpm exec tsc --noEmit` pasa sin errores (no hay script de typecheck dedicado).
- [ ] Lint y formato pasan sin errores.
- [ ] Naming consistente con la sección 1 de este documento.
- [ ] Si toca flujo crítico, hay al menos un test que lo cubre.
- [ ] Errores manejados de forma segura (no se filtran errores crudos de Supabase a la UI).
- [ ] Accesibilidad mínima respetada en elementos interactivos nuevos.
- [ ] El commit solo se ejecutó tras aprobación explícita del usuario (sección 2.1) y sigue el formato de Conventional Commits.
- [ ] Si hubo ambigüedad sobre una convención, se preguntó al usuario en vez de asumir.
- [ ] Ninguno de los anti-patrones de la sección 8 está presente en el código nuevo.

## 8. Anti-patrones (ejemplos concretos de qué NO hacer)

Estos son errores reales y probables que un agente de IA podría cometer al no tener el contraejemplo explícito. Cada uno viola una regla ya establecida en este set de documentos — se listan aquí en forma de código para que sean imposibles de pasar por alto.

**Saltarse `StorageProvider` y llamar al SDK del proveedor directamente:**

```typescript
// ❌ MAL — llama directo al SDK de Vercel Blob desde un componente
import { put } from '@vercel/blob';
const url = await put('lots/123/plan.webp', file);

// ✅ BIEN — pasa por la abstracción, permite cambiar de proveedor sin tocar este código
import { getStorageProvider } from '@/lib/storage/provider';
const url = await getStorageProvider().uploadAsset(clientId, 'lots/123/plan.webp', file);
```

**Escribir a Supabase directamente desde un componente cliente:**

```typescript
// ❌ MAL — mutación disparada desde 'use client', sin Server Action, sin validación Zod
'use client';
async function handleSave() {
  await supabase.from('lots').update({ price: inputValue }).eq('id', lotId);
}

// ✅ BIEN — pasa por una Server Action con validación
('use client');
async function handleSave() {
  await updateLot(lotId, { price: inputValue }); // Server Action, valida con Zod, checa sesión
}
```

**Condicionar lógica de negocio por cliente dentro del código de la plantilla:**

```typescript
// ❌ MAL — ramifica el comportamiento según el cliente, rompe la reutilización del template
if (process.env.NEXT_PUBLIC_CLIENT_SLUG === 'inmobiliaria-los-robles') {
  showExtraDiscountBanner();
}

// ✅ BIEN — la diferencia vive en datos, no en código
const { data: promo } = await supabase.from('lots').select('has_discount').eq('id', lotId);
if (promo.has_discount) showExtraDiscountBanner();
```

**Usar `any` para evitar resolver un tipo:**

```typescript
// ❌ MAL — sin tipar, sin justificación, se cuela a producción
function handleLotUpdate(data: any) { ... }

// ✅ BIEN — tipo derivado del esquema Zod, o al menos un TODO explícito y temporal
function handleLotUpdate(data: LotUpdateInput) { ... }
// Si de verdad no se puede tipar aún: const data: any = ...; // TODO: tipar cuando se defina el payload real de X
```

**Mezclar idiomas en identificadores de código:**

```typescript
// ❌ MAL — mezcla español e inglés en el mismo scope
function actualizarLotStatus(loteId: string, nuevoStatus: string) { ... }

// ✅ BIEN — todo el identificador en inglés, consistente
function updateLotStatus(lotId: string, newStatus: string) { ... }
```

**Reproducir una transición "al revés" en vez de usar el clip dedicado a ese sentido:**

```typescript
// ❌ MAL — intenta invertir un video con playbackRate negativo (poco confiable entre navegadores)
videoRef.current.playbackRate = -1;
videoRef.current.play();

// ✅ BIEN — usa el clip independiente ya generado para ese sentido exacto
const videoUrl = getTransitionVideoUrl('rear', 'front'); // fila independiente en view_transitions
transitionPlayer.play(videoUrl);
```

**Construir un CRUD en `/admin` sin que se haya pedido en esta fase del proyecto:**

```typescript
// ❌ MAL — un agente "adelanta trabajo" agregando un formulario de views/transitions
// sin que el usuario lo haya pedido, en una fase donde la carga es manual por SQL (ver sección 0 de 02-architecture.md)

// ✅ BIEN — si la tarea no lo pide explícitamente, no se construye. Se deja el esquema/validaciones
// listos (Zod, RLS) para que ese CRUD se pueda construir después sin fricción, pero no se anticipa la UI.
```

---

**Última actualización:** 2026-09-23 · **Versión:** 1.8
