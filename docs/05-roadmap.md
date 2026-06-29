# 05 · Roadmap por fases

Construir en este orden. **No saltar fases.** Cada fase se prueba y funciona antes de seguir. Esto evita el error clásico de armar todo a medias.

---

## Fase 0 · Cimientos (1 sesión)
**Meta:** proyecto vacío que corre y se ve con tu marca.
- [ ] Crear proyecto Next.js + TypeScript + Tailwind + pnpm.
- [ ] Instalar shadcn/ui.
- [ ] Copiar `colors_and_type.css` → `app/globals.css`. Copiar `fonts/` → `public/fonts/`.
- [ ] Mapear tokens de marca en `tailwind.config.ts` (colores, fuentes).
- [ ] Página de prueba con fondo charcoal + título Unbounded. Corre en `localhost:3000`.
**Listo cuando:** ves "Hay Equipo" con la fuente y color correctos.

---

## Fase 1 · Datos y usuarios (1–2 sesiones)
**Meta:** base de datos real + login funcionando.
- [ ] Crear proyecto en Supabase. Pegar `supabase/schema.sql` en el SQL Editor.
- [ ] Configurar `.env.local` con URL y anon key.
- [ ] Clientes Supabase (`lib/supabase/`).
- [ ] Pantalla de login/registro (email + contraseña).
- [ ] `middleware.ts` protege la zona `(app)/`.
- [ ] Al registrarse, crear un team y meter al usuario como `owner`.
- [ ] Generar tipos: `supabase gen types typescript` → `lib/types.ts`.
**Listo cuando:** Juan se registra, entra, y existe en la BD con su equipo.

---

## Fase 2 · El corazón: Hoy + Tareas (2 sesiones)
**Meta:** la pantalla principal funcionando con datos reales.
- [ ] `lib/queries/tasks.ts` + `projects.ts` (CRUD).
- [ ] Vista **Hoy**: tareas con `scheduled_date = hoy` del usuario logueado.
- [ ] `TaskCard` con slider 0–100% + nota (guardan en BD).
- [ ] Quick-add (crear tarea en < 5s).
- [ ] Estado vacío bonito.
**Listo cuando:** Juan crea tareas, mueve el slider, escribe nota, recarga y todo sigue ahí.

---

## Fase 3 · Proyectos y Objetivos (1 sesión)
- [ ] Página **Proyectos** (type=proyecto) y **Objetivos** (type=objetivo), separadas.
- [ ] `ProjectCard` con avance derivado (promedio de sus tareas) + KPI.
- [ ] Agregar tarea dentro de un proyecto → cae al backlog (`scheduled_date = NULL`).
- [ ] `NewProjectDialog` (modal con nombre + KPI + ícono).
**Listo cuando:** creas un proyecto con KPI y le agregas tareas que aparecen en el backlog.

---

## Fase 4 · Semana + Backlog drawer (2 sesiones)
- [ ] Vista **Semana**: 7 columnas (lun–dom de la semana actual, con fechas reales).
- [ ] **Backlog** como panel lateral derecho (drawer) que se abre/cierra.
- [ ] Drag & drop (@dnd-kit): arrastrar del backlog a un día → setea `scheduled_date`.
- [ ] Asignar responsable con 1 clic en el avatar.
- [ ] Día de hoy resaltado; vinculado con la vista Hoy.
**Listo cuando:** arrastras una tarea del backlog a "miércoles" y aparece en Hoy ese día.

---

## Fase 5 · Cronómetro + Horas (1 sesión)
- [ ] `lib/queries/time.ts`: startSession / stopSession / getHours.
- [ ] `Timer` start/stop; la sesión corriendo = fila con `ended_at NULL`.
- [ ] **Persiste con nombre del usuario** y aunque cierres el navegador.
- [ ] Mostrar horas de hoy y de la semana (suma de sesiones).
**Listo cuando:** Salma inicia el cronómetro, cierra la pestaña, vuelve y sigue corriendo; al parar queda registrado a su nombre.

---

## Fase 6 · Libro de Novedades (1 sesión)
- [ ] Form guiado: proyecto + avances + problema + siguientes pasos.
- [ ] Feed agrupado por día, con avatar y estructura legible.
- [ ] (Opcional) Botón "ordenar con IA" usando Claude API (haiku) para pulir el texto.
**Listo cuando:** escribes una novedad guiada y queda ordenada y legible para el equipo.

---

## Fase 7 · Realtime + Pulido (1 sesión)
- [ ] Suscripción realtime: cambios de Juan se ven en el dispositivo de Salma al instante.
- [ ] Responsive (celular).
- [ ] Estados de carga (skeletons), animaciones (150–300ms).
- [ ] Deploy a Vercel con dominio.
**Listo cuando:** los dos lo usan en sus celulares y se ven los cambios en vivo.

---

## Fase 8 · Capa 4 (después, cuando el uso sea constante)
- [ ] Notificaciones + **alarmas con sonido** (Notification API + Web Audio; luego PWA/Capacitor para alarma real).
- [ ] Notas personales y de equipo en el perfil.
- [ ] Invitar miembros al equipo (link de invitación).
- [ ] Onboarding para vender a otros equipos.

---

## Cómo medir cada fase
Después de cada fase, una sola pregunta: **¿esto acerca a que Salma lo use sola?** Si una funcionalidad no aporta a eso, va al final de la cola.
