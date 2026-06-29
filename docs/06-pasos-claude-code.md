# 06 · Pasos con Claude Code (VS Code)

Guía operativa: qué hacer tú, qué pedirle a Claude Code, en orden. Los prompts están listos para copiar/pegar.

---

## Paso 0 · Preparar la carpeta

En tu terminal (fuera de la carpeta del prototipo):

```bash
mkdir hay-equipo && cd hay-equipo
git init
```

Copia dentro de `hay-equipo/`:
- La carpeta `docs/` (estos documentos).
- La carpeta `supabase/` (con `schema.sql`).
- La carpeta `fonts/` y el archivo `colors_and_type.css` del prototipo.

Abre VS Code en esa carpeta y abre Claude Code.

**Primer prompt a Claude Code:**
> Lee `docs/README.md` y todos los archivos dentro de `docs/`, además de `supabase/schema.sql`. Vamos a construir este producto siguiendo `docs/05-roadmap.md`, fase por fase, sin saltar ninguna. Confírmame que entendiste la visión, el stack y el modelo de datos, y dime qué necesitas de mí para empezar la **Fase 0**.

---

## Paso 1 · Cuentas que necesitas (gratis)

Antes de la Fase 1, crea:
1. **Supabase** → supabase.com → New project. Guarda la *Project URL* y la *anon public key* (Settings → API).
2. **Vercel** → vercel.com (para la Fase 7). Conéctalo a GitHub.

Claude Code puede usar la **skill de Supabase** y la **de Vercel** que ya tienes instaladas para ayudarte con esto.

---

## Paso 2 · Ritmo de trabajo (una fase a la vez)

Para cada fase del roadmap, el patrón es:

**Prompt de inicio de fase:**
> Vamos con la **Fase N** de `docs/05-roadmap.md`. Antes de escribir código, dime tu plan: qué archivos vas a crear/tocar y por qué. Espera mi OK.

**Después de que te muestre el plan:** revísalo, di "dale" o ajusta.

**Prompt de cierre de fase:**
> Probemos la Fase N. Levanta el dev server y verifica que [criterio "Listo cuando" de esa fase] funciona. Muéstrame evidencia. Si algo falla, arréglalo antes de seguir.

**No avances** a la fase siguiente hasta que el "Listo cuando" se cumpla de verdad.

---

## Paso 3 · Comandos clave (Claude Code los corre, tú los entiendes)

```bash
# Fase 0 — crear el proyecto
pnpm create next-app@latest . --typescript --tailwind --app --eslint

# shadcn/ui
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button dialog drawer select slider textarea

# dependencias del producto
pnpm add @supabase/supabase-js @supabase/ssr @dnd-kit/core @dnd-kit/sortable date-fns

# tipos desde la BD real (Fase 1)
pnpm dlx supabase gen types typescript --project-id TU_PROJECT_ID > lib/types.ts

# correr en local
pnpm dev

# deploy (Fase 7)
pnpm dlx vercel
```

---

## Paso 4 · Reglas para que Claude Code no se desvíe

Dale estas reglas al inicio (o ponlas en un `CLAUDE.md` en la raíz del repo):

```
# Reglas del proyecto Hay Equipo

- Seguir docs/05-roadmap.md fase por fase. No adelantar funciones de fases futuras.
- Toda llamada a la base de datos va en lib/queries/. Los componentes NO llaman a Supabase directo.
- Usar los tokens de marca de globals.css (colores, fuentes). Nunca hex sueltos en componentes.
- Tipos siempre desde lib/types.ts (generados). No inventar tipos a mano.
- Modo oscuro por defecto. Avance de tareas SIEMPRE 0–100% (nunca check binario).
- Pantallas calmadas: por defecto mostrar solo lo de hoy. El resto se despliega a pedido.
- Textos para el usuario en español; nombres de código en inglés.
- Cada componente nuevo: probarlo en el navegador antes de darlo por hecho.
```

---

## Paso 5 · Migrar lo que ya está hecho

No empezar de cero del todo:
- **Marca:** `colors_and_type.css` → `app/globals.css` + `tailwind.config.ts`. Ya tienes el sistema visual.
- **Prototipo como referencia visual:** abre `prototipo.html` al lado. Dile a Claude Code: *"replica la vista Hoy del prototipo, pero con datos reales de Supabase"*. El prototipo es la fuente de verdad del diseño y la interacción.

---

## Paso 6 · Buenas prácticas de Git

```bash
# una rama por fase
git checkout -b fase-2-hoy-tareas
# … trabajo …
git add . && git commit -m "feat: vista Hoy con tareas reales"
```

Commit pequeño y seguido. Así, si algo se rompe, vuelves atrás fácil.

---

## Recordatorio final

El prototipo ya demostró que la idea funciona y gusta. Esta fase es **convertirlo en algo real, seguro y vendible** — no reinventarlo. Sigue el plano, fase por fase, y prueba con Salma seguido. Cuando ella lo use sola, ganaste.
