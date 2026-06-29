# Hay Equipo — Documentación del producto real

Esta carpeta contiene **todo lo necesario para construir la app real, escalable y multi-usuario** con Claude Code en VS Code.

El prototipo (`../prototipo.html`) ya validó la experiencia. Estos docs son el plano para convertirlo en producto de verdad: con usuarios, base de datos, login, datos seguros y listo para vender a otros equipos.

## Orden de lectura

| # | Archivo | Qué responde |
|---|---------|--------------|
| 1 | [01-vision.md](01-vision.md) | Qué es, para quién, principios que NO se rompen |
| 2 | [02-stack.md](02-stack.md) | Con qué tecnologías y por qué |
| 3 | [03-estructura-carpetas.md](03-estructura-carpetas.md) | Cómo se organiza el código |
| 4 | [04-modelo-datos.md](04-modelo-datos.md) | Tablas, relaciones, seguridad |
| 5 | [05-roadmap.md](05-roadmap.md) | En qué orden construir (fases) |
| 6 | [06-pasos-claude-code.md](06-pasos-claude-code.md) | Comandos y prompts exactos para Claude Code |
| — | [../supabase/schema.sql](../supabase/schema.sql) | El SQL real de la base de datos |

## Cómo usar esto con Claude Code

1. Abre VS Code en una carpeta **nueva y vacía** (no esta — esta es solo diseño/prototipo).
2. Copia la carpeta `docs/` y el archivo `supabase/schema.sql` a la carpeta nueva.
3. Copia también `fonts/` y `colors_and_type.css` (la marca ya está hecha, hay que reusarla).
4. Abre Claude Code y dile: **"Lee docs/README.md y todos los archivos de docs/. Vamos a construir este producto siguiendo el roadmap, fase por fase. Empieza por la Fase 0."**
5. Ve fase por fase. No dejes que salte fases. Cada fase se prueba antes de seguir.

## Regla de oro

> El éxito NO es "tiene todas las funciones".
> El éxito es **"Salma lo abre sola un martes sin que le insistan"**.
> Cada decisión se mide contra eso.
