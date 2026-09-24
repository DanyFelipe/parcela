# 00 — Índice de Contexto para Agentes de IA

> Este directorio (`/docs/ai-context/`) es la **fuente de verdad** del proyecto para cualquier agente de IA (Claude, GPT, Copilot, Cursor, Windsurf, etc.). Antes de escribir o modificar código, identifica qué documento(s) aplican a tu tarea y cárgalos en tu contexto. **No asumas convenciones por entrenamiento genérico** cuando este proyecto ya las define explícitamente.

## Regla de oro

Si una instrucción del usuario en el chat contradice algo escrito en estos documentos, **el agente debe señalar el conflicto explícitamente y pedir confirmación antes de proceder**, no resolverlo por su cuenta asumiendo que el mensaje más reciente tiene prioridad automática. Estos documentos representan decisiones ya deliberadas; un mensaje suelto en una conversación puede ser una idea a mitad de pensar.

**Excepción (decisión adoptada explícitamente por el usuario):** cuando la instrucción en el chat **es** una modificación deliberada de uno de estos documentos pedida por el propio usuario (ej. "borra el 05", "agrega esta regla"), se aplica directamente — el conflicto no existe, el chat _es_ la aprobación. Se aplica el proceso de versionado de la sección correspondiente.

## Mapa de documentos

| Documento                                            | Cuándo cargarlo                                                                                                                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`01-stack-and-infra.md`](./01-stack-and-infra.md)   | Elegir una librería, tocar infraestructura, proveedores, variables de entorno, hosting, storage                                                                       |
| [`02-architecture.md`](./02-architecture.md)         | Crear archivos nuevos, entender dónde vive cada pieza, patrones (StorageProvider, Server Actions, estado), flujo de la app                                            |
| [`03-database.md`](./03-database.md)                 | Cualquier tarea que lea o escriba en Supabase: tablas, columnas, RLS, queries, migraciones                                                                            |
| [`04-coding-standards.md`](./04-coding-standards.md) | Naming, testing, git/commits, formato, checklist de calidad, manejo de errores                                                                                        |
| [`DEVELOPMENT-PLAN.md`](./DEVELOPMENT-PLAN.md)       | Plan por sprints, tickets `PARC-XXX`, estimaciones, Definition of Done y estado de avance. Léelo para saber en qué punto está el proyecto y qué se construye en orden |

## Dirección de diseño visual (reemplaza al antiguo `05-design-system.md`)

**No existe un documento de design system propio.** Toda tarea de diseño visual — crear o modificar un componente, elegir colores, tipografía, spacing, animación de UI — se resuelve con **solo estas 2 fuentes**:

1. **`shadcn/ui` estándar** (`01-stack-and-infra.md`, sección 1): la base de componentes (`components/ui/`, Radix + Tailwind). Los componentes generados no se editan a mano (`02-architecture.md`, sección 1) y sus tokens/variantes son el punto de partida de cualquier estilo.
2. **Skill `frontend-design`** (`.agents/skills/frontend-design/SKILL.md`): dirección estética, composición y decisiones de diseño cuando se crea UI nueva o se resculpe una existente. Se carga junto con `02-architecture.md` cuando la tarea sea visual.

**Regla:** si una tarea de UI no se resuelve con shadcn/ui + la skill, es una ambigüedad — **preguntar antes de asumir**, no inventar un sistema de estilos paralelo.

**Decisión de producto que se conserva** (antes vivía en `05-design-system.md`, sección 2): el tema visual es **fijo** — un solo tema, sin modo oscuro ni selector de tema. Ver también `AGENTS.md`, reglas no negociables.

**Tareas que cruzan dominios** (la mayoría de las tareas reales) requieren cargar más de un documento. Ejemplos:

- _"Agrega el campo `fecha_reserva` al lote y muéstralo en el panel admin"_ → `03-database.md` + `02-architecture.md` + `04-coding-standards.md`
- _"Cambia el hover de las tarjetas de lote"_ → skill `frontend-design` + `02-architecture.md`
- _"Migra el storage de este cliente a Cloudflare R2"_ → `01-stack-and-infra.md` + `02-architecture.md`

Si tienes duda de qué documentos aplican, **carga de más, no de menos** — es preferible contexto extra a una implementación que ignora una convención ya definida.

## Contexto general del proyecto (resumen de 3 líneas)

Showroom inmobiliario inmersivo para loteos/terrenos: renders de D5 Render, retocados en Photoshop, conectados por transiciones generadas con IA (convertidas a secuencias de frames) para simular rotación y navegación hacia el detalle de cada lote, con reversa al volver. Es una **plantilla multi-cliente**: cada inmobiliaria tiene su propio dominio, proyecto Vercel y proyecto Supabase, desplegados de forma independiente.

## Versionado

Cualquier cambio a estos documentos que altere una decisión ya tomada (no una corrección de typo) debe:

1. Ser aprobado por el usuario/equipo técnico — un agente de IA no debe reescribir estas reglas de forma autónoma, solo proponer el cambio.
2. Actualizar la fecha en el pie del documento modificado.
3. Si el cambio afecta a clientes ya desplegados, señalarlo explícitamente como una decisión que **no se aplica retroactivamente** salvo instrucción contraria.

---

**Última actualización:** 2026-09-23 · **Versión:** 1.3
