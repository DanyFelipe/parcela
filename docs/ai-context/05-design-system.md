# 05 — Sistema de Diseño

> Ver [`00-INDEX.md`](./00-INDEX.md) para las reglas generales. Este documento define la dirección visual **base** de la plantilla. Cada cliente puede recibir ajustes de paleta/tipografía sobre esta base (ver sección 6), pero los principios de composición y espaciado se mantienen salvo decisión explícita en contrario.

## Reglas específicas de este documento

1. **Todo valor visual (color, espaciado, tipografía, radio de borde, sombra) debe salir de los tokens definidos aquí y configurados en `tailwind.config.ts`.** Un agente de IA no debe escribir colores hexadecimales sueltos (`bg-[#f3f3f3]`) ni valores de spacing arbitrarios (`mt-[13px]`) directamente en un componente — si el token que necesitas no existe, se agrega al config, no se hardcodea inline.
2. **El render/imagen siempre es el protagonista.** La UI (botones, texto, controles) existe para no competir visualmente con el contenido — es un principio de diseño, no una sugerencia estética.
3. Si una tarea de diseño no está cubierta por este documento (ej. un patrón de componente nuevo), el agente debe proponer una opción consistente con estos principios y **preguntar antes de asumir**, no inventar un estilo visual distinto al del resto del proyecto.

---

## 1. Dirección de diseño

**Minimalista, elegante, estilo Apple.** Esto se traduce en decisiones concretas, no solo en una sensación:

- **Espacio en blanco (whitespace) generoso.** Cuando haya duda entre "más apretado" o "más espacio", se elige más espacio.
- **Jerarquía tipográfica clara con pocos pesos.** No más de 2-3 pesos de fuente en toda la interfaz (ej. Regular, Medium, Semibold) — nunca Light y Black en el mismo layout compitiendo.
- **Color como acento, no como base.** La interfaz vive predominantemente en escala de grises/neutros; el color se reserva para estados (disponible/reservado/vendido) y para un acento de marca puntual.
- **Transiciones suaves, nunca abruptas.** Toda aparición/desaparición de UI usa easing, nunca un cambio instantáneo (`opacity: 0 → 1` sin transición es un error de implementación, no un estilo aceptable).
- **Profundidad sutil, no decorativa.** Sombras suaves y `backdrop-blur` para paneles flotantes sobre el render (estilo "vidrio esmerilado" de macOS/iOS), nunca sombras duras ni bordes gruesos de color.
- **Los controles son discretos hasta que se necesitan.** Botones de rotación, hotspots y controles de navegación deben sentirse presentes pero no gritar por atención — aparecen con opacidad reducida en reposo y cobran presencia en hover/focus.

## 2. Paleta de colores (tokens base)

```typescript
// tailwind.config.ts (fragmento de referencia)
colors: {
  // Neutros — base de toda la interfaz
  neutral: {
    50:  '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },
  // Acento de marca — reemplazable por cliente, ver sección 6
  accent: {
    DEFAULT: '#0071E3',  // azul estilo Apple, punto de partida neutro de marca
    hover:   '#0077ED',
    subtle:  '#E8F1FC',
  },
  // Estados de negocio (lotes) — semántica fija, no cambia por cliente
  status: {
    disponible: '#16A34A',   // verde
    reservado:  '#D97706',   // ámbar
    vendido:    '#DC2626',   // rojo
  },
},
```

**Regla:** los colores de `status` (disponible/reservado/vendido) son semánticos y **no cambian por cliente** — son parte de la lógica de negocio, no de la identidad de marca. El color `accent` sí es personalizable por cliente (sección 6).

## 3. Tipografía

- **Fuente:** SF Pro (si hay licencia/contexto Apple-adjacent) o, como alternativa web-safe de espíritu equivalente, **Inter** o **General Sans**. Definir una sola familia para toda la interfaz — no mezclar fuentes.
- **Escala tipográfica** (referencia, ajustar en `tailwind.config.ts` como tokens `text-*`):

| Token          | Tamaño                                  | Uso                                    |
| -------------- | --------------------------------------- | -------------------------------------- |
| `text-display` | 56–72px, peso Semibold                  | Título del showroom, momentos hero     |
| `text-h1`      | 36px, peso Semibold                     | Encabezado de vista de detalle de lote |
| `text-h2`      | 24px, peso Medium                       | Subsecciones (precio, superficie)      |
| `text-body`    | 16px, peso Regular                      | Descripciones, texto general           |
| `text-caption` | 13px, peso Regular, color `neutral-500` | Metadatos, notas secundarias           |

- **Line-height generoso**: mínimo 1.4 en texto de cuerpo, 1.1–1.2 en títulos grandes.
- **Nunca texto en negro puro (`#000`) sobre blanco puro (`#FFF`)** — usar `neutral-900` sobre `neutral-50` para suavizar el contraste, principio típico de interfaces Apple.

## 4. Espaciado y layout

- Sistema de espaciado en múltiplos de **4px** (estándar Tailwind por defecto: `1 = 4px`, `2 = 8px`, etc.) — no introducir valores fuera de esta escala.
- Contenedores de contenido con **max-width** consistente (ej. `max-w-6xl` para paneles de información), nunca contenido de texto ocupando el ancho completo de pantallas grandes.
- Padding interno mínimo de paneles flotantes sobre el render: `p-6` a `p-8` — el minimalismo Apple evita elementos "apretados".

## 5. Componentes flotantes sobre el render (paneles de información, controles)

Estilo de referencia ("vidrio esmerilado"):

```css
/* Ejemplo conceptual, expresar como clases utilitarias de Tailwind en el componente real */
background: rgba(255, 255, 255, 0.7);
backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.3);
border-radius: 20px; /* radios generosos, nunca esquinas casi rectas */
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08); /* sombra suave, difusa, nunca dura */
```

- Radio de borde: usar tokens grandes de forma consistente — `rounded-2xl` (16px) o `rounded-3xl` (24px) para paneles y tarjetas; `rounded-full` para botones circulares de acción (ej. botón "volver").
- Nunca bordes de 2px+ en color sólido saturado — si se necesita un borde, es sutil (`border-neutral-200` o blanco translúcido sobre el render).

## 6. Personalización por cliente

Lo que **sí cambia** por cliente (vive en configuración/datos, no se hardcodea en componentes):

- Color `accent` (identidad de marca de la inmobiliaria).
- Logo (ubicado en una posición fija definida por el layout base).
- Fuente, **solo si el cliente lo exige explícitamente** — el default de la plantilla no cambia por capricho.

Lo que **no cambia** por cliente (consistencia del producto, valor de la plantilla):

- Escala tipográfica y jerarquía.
- Sistema de espaciado.
- Colores semánticos de estado (`status.*`).
- Principios de movimiento (sección 7) y el estilo "vidrio esmerilado" de paneles flotantes.

## 7. Principios de movimiento (animación)

- **Easing de referencia:** `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out estándar tipo Apple) para la mayoría de las transiciones de UI. No aplica al video de cambio de vista (`TransitionVideoPlayer`), cuyo timing lo define el clip mismo, no un easing de CSS.
- **Duración:** micro-interacciones (hover, focus) 150–200ms; apariciones de paneles 250–350ms; nunca animaciones de UI que superen 500ms, ya que compiten con el tiempo del video de transición entre vistas, que es el protagonista real de ese momento.
- **`prefers-reduced-motion`:** cuando está activado, las animaciones de UI (no el video de transición de vista, que es parte del contenido y se maneja según lo indicado en `04-coding-standards.md`) deben reducirse a un simple fade corto o eliminarse.

## 9. Responsive: alcance del diseño adaptable

**La estrategia técnica completa vive en `02-architecture.md`, sección 9 — este apartado solo cubre la consecuencia para diseño de UI.** Regla resumida: el render, los hotspots y el visor 360° **nunca se rediseñan ni reescalan por breakpoint** (en mobile se navegan por scroll/slider horizontal, no se adaptan). Lo único que un agente de IA diseña "a la mobile-first" o con variantes `sm:`/`md:`/`lg:` de Tailwind es la **UI de interfaz**: navbar, paneles de ficha técnica, formularios de admin, menús, tipografía de textos de interfaz.

**Consecuencia práctica para el diseño de la UI en mobile:**

- Los paneles flotantes de ficha técnica (estilo vidrio esmerilado, sección 5) pueden pasar de un panel lateral en desktop a un panel deslizable desde abajo (_bottom sheet_) en mobile — este es un cambio de UI válido y esperado.
- Los controles de navegación entre vistas (`front`/`rear`/`top`) deben permanecer accesibles y con buen tamaño de toque (mínimo 44×44px de área táctil) incluso cuando el render se recorre con scroll horizontal.
- Nunca se reduce el tamaño de un hotspot por breakpoint para "que quepa mejor" — su posición y tamaño son parte del render, no de la UI.

## 10. Checklist de diseño antes de dar por terminado un componente visual

- [ ] ¿Todo color/spacing/radio usado sale de los tokens de Tailwind config, sin valores arbitrarios inline?
- [ ] ¿El render/imagen sigue siendo el elemento dominante de la composición?
- [ ] ¿Hay como máximo 2-3 pesos tipográficos en la vista?
- [ ] ¿Los controles interactivos tienen un estado de reposo discreto y un estado de hover/focus más presente?
- [ ] ¿Las transiciones de aparición de UI usan easing y duración dentro de los rangos definidos en la sección 7?
- [ ] ¿Se respeta el contraste mínimo AA en texto sobre imagen?
- [ ] ¿Ningún cambio afecta el render, los hotspots o el visor 360° por motivo de responsive? (solo la UI de interfaz puede adaptarse — ver sección 9)

---

**Última actualización:** 2026-09-16 · **Versión:** 1.2
