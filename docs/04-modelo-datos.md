# 04 · Modelo de datos

Diseñado para ser **multi-equipo desde el día 1** (para vender después) y **seguro** (cada quien ve solo lo suyo).

## Diagrama de relaciones

```
auth.users (lo maneja Supabase)
   │ 1:1
   ▼
profiles ──────────┐
   │ N:M           │ crea/asigna
   ▼               ▼
team_members ──► teams ──► projects ──► tasks
                              │            │
                              │            ├─► time_sessions (quién, cuánto)
                              │            └─► reminders (alarmas, Capa 4)
                              └─► news_entries (libro de novedades)
```

## Tablas

### `profiles`
Datos del usuario (extiende `auth.users` de Supabase).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | = auth.users.id |
| full_name | text | "Juan", "Salma" |
| avatar_color | text | hex o nombre, para el avatar |
| created_at | timestamptz | |

### `teams`
Un equipo. Aquí está la clave para vender: cada cliente = un team aislado.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| name | text | "Hay Equipo" |
| owner_id | uuid FK→profiles | quién lo creó |
| created_at | timestamptz | |

### `team_members`
Quién pertenece a qué equipo y con qué rol.

| Columna | Tipo | Notas |
|---------|------|-------|
| team_id | uuid FK→teams | |
| user_id | uuid FK→profiles | |
| role | text | 'owner' \| 'admin' \| 'member' |
| PK | (team_id, user_id) | |

### `projects`
Proyectos **y** objetivos (los distingue `type`).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | aislamiento |
| name | text | |
| type | text | 'proyecto' \| 'objetivo' |
| kpi | text | cómo se mide el éxito |
| color | text | hex de marca |
| icon | text | emoji |
| archived | bool | default false |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |

### `tasks`
El corazón. Avance gradual, responsable, día (fecha real).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| project_id | uuid FK→projects | de qué proyecto/objetivo cuelga |
| title | text | |
| assignee_id | uuid FK→profiles NULL | responsable; NULL = sin asignar |
| scheduled_date | date NULL | día agendado; **NULL = backlog** |
| progress | int | 0–100 (CHECK) |
| note | text | "qué avancé / qué problema" |
| created_by | uuid FK→profiles | |
| created_at | timestamptz | |

> **Decisión clave:** usar `scheduled_date` (fecha real) en vez de "lunes/martes". Así la vista Semana calcula la semana actual (lun–dom) con fechas reales, "Hoy" = tareas de la fecha de hoy, y todo se vincula solo. Escala a semanas futuras sin tocar nada.

### `time_sessions`
Cada sesión de cronómetro, **con nombre del que la hizo** (lo que pediste).

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| user_id | uuid FK→profiles | **quién trabajó** |
| task_id | uuid FK→tasks NULL | opcional: en qué tarea |
| started_at | timestamptz | |
| ended_at | timestamptz NULL | NULL = corriendo ahora |
| minutes | int NULL | se calcula al parar |

> Las horas del día/semana se **suman** de aquí (`SUM(minutes) WHERE user_id=… AND día`). El cronómetro corriendo = la fila con `ended_at IS NULL`. Persiste aunque cierres el navegador.

### `news_entries`
Libro de novedades, estructurado.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| author_id | uuid FK→profiles | |
| project_id | uuid FK→projects NULL | con qué avanzó |
| advances | text[] | lista de logros |
| problem | text NULL | error/problema |
| next_steps | text NULL | siguientes pasos |
| for_date | date | de qué día es la novedad |
| created_at | timestamptz | |

### `reminders` (Capa 4 — alarmas)
Se deja la tabla lista aunque se implemente después.

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| team_id | uuid FK→teams | |
| task_id | uuid FK→tasks NULL | |
| user_id | uuid FK→profiles | a quién avisa |
| remind_at | timestamptz | cuándo suena |
| sound | text | nombre del sonido |
| repeat | text NULL | 'none' \| 'daily' \| 'weekly' |
| done | bool | default false |

## Seguridad (RLS) — innegociable

Cada tabla con `team_id` lleva una política: **"solo puedo leer/escribir filas de equipos donde soy miembro"**. Esto se logra con una función `is_team_member(team_id)` y políticas RLS. Sin esto, no se puede vender el producto. El SQL completo está en `../supabase/schema.sql`.

## Cómo se mapea el prototipo → BD real

| Prototipo (localStorage) | Producto real (Supabase) |
|--------------------------|--------------------------|
| `st.proj` | tabla `projects` |
| `st.tasks` (day: 'lun') | tabla `tasks` (scheduled_date: fecha real) |
| `st.hours['juan_lun']` | tabla `time_sessions` (sumadas) |
| `st.news` | tabla `news_entries` |
| `id` (empresa/juan/salma) | usuario logueado real (`auth.users`) |
