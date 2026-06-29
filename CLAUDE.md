# Hay Equipo — Reglas del proyecto

Organizador de tareas para equipos chicos, diseñado contra la saturación. Empieza para Juan + Salma; pensado para venderse a otros equipos.

**Antes de escribir código, lee `docs/README.md` y todos los archivos de `docs/`, más `supabase/schema.sql`.** Son el plano. `prototipo.html` es la referencia visual y de interacción.

## Cómo trabajamos
- Seguir `docs/05-roadmap.md` **fase por fase**. No adelantar funciones de fases futuras.
- Antes de cada fase: mostrar el plan (qué archivos y por qué) y esperar OK.
- Cerrar cada fase probándola en el navegador. No avanzar hasta cumplir el "Listo cuando…".
- Commits pequeños y seguidos. Una rama por fase.

## Arquitectura
- **Stack:** Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase + @dnd-kit + date-fns. Deploy en Vercel.
- Toda llamada a la base de datos va en `lib/queries/`. Los componentes **NO** llaman a Supabase directo.
- Tipos siempre desde `lib/types.ts` (generados con `supabase gen types`). No inventar tipos a mano.
- Componentes tontos, queries inteligentes: el componente pinta, la query trae/guarda.
- Multi-equipo desde el día 1: todo filtra por `team_id`. RLS activado (ver schema.sql). Nunca exponer datos de otro equipo.

## Diseño (innegociable)
- Usar los tokens de marca de `app/globals.css` (vienen de `colors_and_type.css`). **Nunca hex sueltos** en componentes.
- Fuentes: Unbounded (títulos), Aeonik (subtítulos), DM Sans (cuerpo). Modo oscuro por defecto.
- Avance de tareas **siempre 0–100%** con slider. Nunca check binario de todo-o-nada.
- Pantallas calmadas: por defecto mostrar **solo lo de hoy**. El backlog y lo demás se despliega a pedido (panel lateral).
- Una acción primaria por pantalla. Animaciones 150–300ms.

## Datos clave
- Tareas usan `scheduled_date` (fecha real). `NULL` = backlog. Así Hoy y Semana se vinculan solos.
- Cronómetro = tabla `time_sessions`, con `user_id` (guardar siempre quién trabajó). Sesión corriendo = `ended_at IS NULL`; persiste aunque se cierre el navegador.
- Proyectos y Objetivos = misma tabla `projects` con `type` ('proyecto' | 'objetivo'); páginas separadas.

## Idioma
- Textos para el usuario en **español**. Nombres de código (variables, tablas, funciones) en **inglés**.

## La regla de oro
El éxito no es "tiene todas las funciones". Es **"Salma lo abre sola un martes sin que le insistan"**. Cada decisión se mide contra eso.
