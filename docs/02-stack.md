# 02 · Stack y decisiones técnicas

## Recomendación (decidida, no menú)

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **Framework** | **Next.js 15** (App Router) + **TypeScript** | El estándar para web real y escalable. Claude Code lo domina. Sirve front y backend juntos. |
| **Estilos** | **Tailwind CSS** + tus tokens de marca | Rápido, consistente. Tus colores/fuentes se mapean a Tailwind. |
| **Componentes** | **shadcn/ui** | Componentes accesibles y editables (no librería cerrada). Modales, drawers, selects ya resueltos. |
| **Base de datos + Auth** | **Supabase** (Postgres + Auth + Realtime) | Usuarios, login, datos estructurados, seguridad por filas (RLS) y actualización en vivo. Gratis para empezar, escala solo. |
| **Drag & drop** | **@dnd-kit** | Para arrastrar tareas a días en la vista Semana. |
| **Deploy** | **Vercel** | Un clic, dominio gratis, se integra perfecto con Next.js. |
| **Fechas** | **date-fns** | Calcular semana actual (lun–dom), "hoy", etc. |

## Por qué Supabase y no otra cosa

- **Usuarios reales:** login con email/contraseña o magic link, listo de fábrica.
- **Datos seguros:** Row Level Security (RLS) — Juan no puede ver datos de un equipo ajeno aunque quiera. Esto es **obligatorio** para vender el producto.
- **Multi-equipo (multi-tenant):** la estructura ya separa por `team_id`, así cuando vendas a otro equipo, sus datos quedan aislados sin reescribir nada.
- **Realtime:** cuando Salma mueve una tarea, Juan la ve cambiar al instante.
- **Sin servidor que mantener:** Supabase es backend administrado. Tú te enfocas en el producto.

## Por qué NO empezar con app nativa

- La web cubre el 100% de la Capa 1–3. Funciona en compu y celular (responsive).
- Cuando llegue el momento de **alarmas reales con sonido** (Capa 4), se envuelve la web con **Capacitor** para sacar apps iOS/Android reutilizando TODO el código. No se tira nada.

## Versionado y entorno

- **Node 20+**, **pnpm** como gestor de paquetes (más rápido y ordenado que npm).
- **Git** desde el día 1. Un repo. Ramas por funcionalidad.
- **.env.local** para las llaves de Supabase (nunca se sube a Git).

## Costo para arrancar

Todo **gratis** en el tier inicial: Supabase free, Vercel hobby, dominio opcional (~$12/año). Pagas solo cuando crezcas.
