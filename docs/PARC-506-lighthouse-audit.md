# PARC-506 — Auditoría Lighthouse del showroom

## Resultado

Se cumple el presupuesto de performance definido en `docs/ai-context/01-stack-and-infra.md`:

| Perfil  | Objetivo | Performance mediano | Resultado |
| ------- | -------: | ------------------: | --------- |
| Desktop |     > 85 |             **100** | Cumple    |
| Mobile  |     > 70 |              **96** | Cumple    |

Se hicieron tres ejecuciones por perfil contra el build de producción. Las puntuaciones fueron **100, 100, 100** en desktop y **97, 95, 96** en mobile. Los demás scores medianos fueron 100 en accesibilidad, buenas prácticas y SEO para ambos perfiles.

## Métricas medianas

| Métrica                        | Desktop | Mobile |
| ------------------------------ | ------: | -----: |
| First Contentful Paint (FCP)   |  0.22 s | 0.76 s |
| Largest Contentful Paint (LCP) |  0.65 s | 2.68 s |
| Total Blocking Time (TBT)      |    0 ms |  69 ms |
| Cumulative Layout Shift (CLS)  |   0.002 |      0 |
| Transferencia total observada  |  330 KB | 330 KB |
| JavaScript transferido         |  207 KB | 207 KB |

## Método

- Lighthouse CLI **12.8.0**, contra `next build` servido con `next start` en local.
- Desktop: preset `desktop`.
- Mobile: emulación mobile por defecto de Lighthouse.
- Tres ejecuciones por dispositivo; se reporta la mediana de las métricas numéricas y de los scores.
- Comandos de auditoría:

  ```powershell
  lighthouse http://localhost:3100 --preset=desktop --output=json --output-path=./lighthouse-desktop.json
  lighthouse http://localhost:3100 --output=json --output-path=./lighthouse-mobile.json
  ```

## Alcance de los resultados

La medición usa los datos disponibles en el entorno local durante la auditoría. La vista evaluada cargó un render de prueba servido desde `placehold.co` y no solicitó clips de transición en la carga inicial. Los assets de un despliegue real —en especial los renders— pueden cambiar los tiempos y la puntuación; se deben repetir estas mediciones con los assets del cliente antes de fijar su resultado de producción.

La auditoría no identificó una optimización necesaria para alcanzar los umbrales del ticket, por lo que no se modificó código de la experiencia para perseguir una mejora no respaldada por estas mediciones.
