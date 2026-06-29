# 03 · Estructura de carpetas

Estructura limpia, escalable y predecible. Cada cosa tiene su lugar.

```
hay-equipo/
├─ app/                          # Rutas (Next.js App Router)
│  ├─ (auth)/
│  │  └─ login/page.tsx          # Pantalla de login/registro
│  ├─ (app)/                     # Zona protegida (requiere sesión)
│  │  ├─ layout.tsx              # Sidebar + topbar + guard de auth
│  │  ├─ hoy/page.tsx            # Vista Hoy (default)
│  │  ├─ semana/page.tsx         # Calendario semanal + drag&drop
│  │  ├─ proyectos/page.tsx      # Proyectos (type=proyecto)
│  │  ├─ objetivos/page.tsx      # Objetivos (type=objetivo)
│  │  ├─ novedades/page.tsx      # Libro de novedades
│  │  └─ perfil/page.tsx         # Perfil + horas + notas personales
│  ├─ globals.css                # Tokens de marca (de colors_and_type.css)
│  └─ layout.tsx                 # Root layout (fuentes, html)
│
├─ components/
│  ├─ ui/                        # shadcn (button, dialog, drawer, select…)
│  ├─ layout/
│  │  ├─ Sidebar.tsx
│  │  └─ IdentityBadge.tsx       # Quién soy (el usuario logueado)
│  ├─ tasks/
│  │  ├─ TaskCard.tsx            # Tarjeta con slider 0-100% + nota
│  │  └─ ProgressSlider.tsx
│  ├─ week/
│  │  ├─ WeekBoard.tsx           # Grid 7 días
│  │  ├─ DayColumn.tsx           # Columna soltable (drop)
│  │  └─ MiniTask.tsx            # Tarjeta arrastrable + avatar asignable
│  ├─ projects/
│  │  ├─ ProjectCard.tsx
│  │  └─ NewProjectDialog.tsx    # Modal nombre + KPI + ícono
│  ├─ news/
│  │  ├─ NewsComposer.tsx        # Form guiado (avances/problema/siguiente)
│  │  └─ NewsEntry.tsx           # Tarjeta de novedad ordenada
│  ├─ timer/
│  │  └─ Timer.tsx               # Cronómetro start/stop por usuario
│  └─ backlog/
│     └─ BacklogDrawer.tsx       # Panel lateral derecho
│
├─ lib/
│  ├─ supabase/
│  │  ├─ client.ts               # Cliente para el navegador
│  │  ├─ server.ts               # Cliente para Server Components
│  │  └─ middleware.ts           # Refresco de sesión
│  ├─ queries/                   # Toda la lógica de datos, separada por dominio
│  │  ├─ tasks.ts                # getTasks, createTask, updateTask, moveTask…
│  │  ├─ projects.ts
│  │  ├─ time.ts                 # startSession, stopSession, getHours…
│  │  └─ news.ts
│  ├─ types.ts                   # Tipos generados de la BD (supabase gen types)
│  ├─ dates.ts                   # semana actual, hoy, helpers de fechas
│  └─ utils.ts                   # cn(), formateadores
│
├─ hooks/
│  ├─ useUser.ts                 # Usuario logueado + su perfil
│  ├─ useTimer.ts                # Estado del cronómetro (persistente)
│  └─ useRealtime.ts             # Suscripción a cambios en vivo
│
├─ supabase/
│  ├─ migrations/                # Cada cambio de BD versionado
│  └─ schema.sql                 # Esquema completo (ver doc 04)
│
├─ public/
│  └─ fonts/                     # Unbounded, Aeonik, DM Sans (copiar de /fonts)
│
├─ middleware.ts                 # Protege rutas (app)/ — redirige a login si no hay sesión
├─ tailwind.config.ts            # Tokens de marca como utilidades Tailwind
├─ .env.local                    # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (no subir)
├─ .env.example                  # Plantilla sin secretos (sí se sube)
├─ package.json
└─ README.md
```

## Reglas de organización

- **Una pantalla = una carpeta en `app/`.** Nada de páginas gigantes.
- **Toda llamada a la base de datos vive en `lib/queries/`.** Los componentes NO hablan con Supabase directo — llaman a estas funciones. Así, si mañana cambias algo de datos, tocas un solo lugar.
- **Componentes tontos, queries inteligentes.** El componente pinta; la query trae/guarda.
- **Tipos generados, no escritos a mano.** `supabase gen types typescript` mantiene `lib/types.ts` sincronizado con la BD real.
- **Nombres en inglés en el código** (tasks, projects), **textos en español** para el usuario.
