# 00 — Índice de Contexto para Agentes de IA

> Este directorio (`/docs/ai-context/`) es la **fuente de verdad** del proyecto para cualquier agente de IA (Claude, GPT, Copilot, Cursor, Windsurf, etc.). Antes de escribir o modificar código, identifica qué documento(s) aplican a tu tarea y cárgalos en tu contexto. **No asumas convenciones por entrenamiento genérico** cuando este proyecto ya las define explícitamente.

## Regla de oro

Si una instrucción del usuario en el chat contradice algo escrito en estos documentos, **el agente debe señalar el conflicto explícitamente y pedir confirmación antes de proceder**, no resolverlo por su cuenta asumiendo que el mensaje más reciente tiene prioridad automática. Estos documentos representan decisiones ya deliberadas; un mensaje suelto en una conversación puede ser una idea a mitad de pensar.

## Mapa de documentos

| Documento                                            | Cuándo cargarlo                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| [`01-stack-and-infra.md`](./01-stack-and-infra.md)   | Elegir una librería, tocar infraestructura, proveedores, variables de entorno, hosting, storage                            |
| [`02-architecture.md`](./02-architecture.md)         | Crear archivos nuevos, entender dónde vive cada pieza, patrones (StorageProvider, Server Actions, estado), flujo de la app |
| [`03-database.md`](./03-database.md)                 | Cualquier tarea que lea o escriba en Supabase: tablas, columnas, RLS, queries, migraciones                                 |
| [`04-coding-standards.md`](./04-coding-standards.md) | Naming, testing, git/commits, formato, checklist de calidad, manejo de errores                                             |
| [`05-design-system.md`](./05-design-system.md)       | Cualquier componente visual: colores, tipografía, spacing, animación, tono de marca                                        |

**Tareas que cruzan dominios** (la mayoría de las tareas reales) requieren cargar más de un documento. Ejemplos:

- _"Agrega el campo `fecha_reserva` al lote y muéstralo en el panel admin"_ → `03-database.md` + `02-architecture.md` + `04-coding-standards.md`
- _"Cambia el hover de las tarjetas de lote"_ → `05-design-system.md` + `02-architecture.md`
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

**Última actualización:** 2026-09-16 · **Versión:** 1.0
