-- ============================================================
-- Hay Equipo — Esquema de base de datos (Supabase / Postgres)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- O con: supabase db push (si usas la CLI)
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text not null default '',
  avatar_color text not null default '#0cc0df',
  avatar_url   text,                                     -- foto en bucket 'avatars' ({uid}/avatar.ext)
  created_at   timestamptz not null default now()
);

-- Crear perfil automáticamente al registrarse un usuario
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── teams ────────────────────────────────────────────────────
create table if not exists teams (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  owner_id   uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ── team_members ─────────────────────────────────────────────
create table if not exists team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role    text not null default 'member' check (role in ('owner','admin','member')),
  primary key (team_id, user_id)
);

-- Helper: ¿el usuario actual es miembro de este equipo?
create or replace function is_team_member(t uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from team_members
    where team_id = t and user_id = auth.uid()
  );
$$;

-- Helper: ¿el usuario actual es admin (owner/admin) de este equipo?
create or replace function is_team_admin(t uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from team_members
    where team_id = t and user_id = auth.uid()
      and role in ('owner','admin')
  );
$$;

-- ── invites (invitaciones por email; se resuelven al registrarse) ─
create table if not exists invites (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references teams(id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin','member')),
  invited_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  unique (team_id, email)
);

-- ── company_objectives (Metas de empresa — nivel superior) ───
create table if not exists company_objectives (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references teams(id) on delete cascade,
  name        text not null,
  kpi         text not null default '',
  target_date date,
  color       text not null default '#0057FF',
  icon        text not null default '🏁',
  archived    boolean not null default false,
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);

-- ── projects (apuntan opcionalmente a una Meta) ──────────────
create table if not exists projects (
  id                   uuid primary key default uuid_generate_v4(),
  team_id              uuid not null references teams(id) on delete cascade,
  name                 text not null,
  company_objective_id uuid references company_objectives(id) on delete set null,
  color                text not null default '#0057FF',
  icon                 text not null default '📌',
  archived             boolean not null default false,
  created_by           uuid not null references profiles(id),
  created_at           timestamptz not null default now()
);

-- ── objectives (Objetivos de proyecto, con KPI) ──────────────
create table if not exists objectives (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references teams(id) on delete cascade,
  project_id  uuid not null references projects(id) on delete cascade,
  name        text not null,
  kpi         text not null default '',
  target_date date,
  color       text not null default '#0057FF',
  icon        text not null default '🎯',
  archived    boolean not null default false,
  created_by  uuid not null references profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists objectives_project_idx on objectives(project_id);

-- ── tasks (cuelgan de un objetivo — jerarquía estricta) ──────
create table if not exists tasks (
  id             uuid primary key default uuid_generate_v4(),
  team_id        uuid not null references teams(id) on delete cascade,
  objective_id   uuid not null references objectives(id) on delete cascade,
  title          text not null,
  assignee_id    uuid references profiles(id),          -- NULL = sin asignar
  scheduled_date date,                                  -- NULL = backlog
  progress       int not null default 0 check (progress between 0 and 100),
  done           boolean not null default false,
  note           text not null default '',
  created_by     uuid not null references profiles(id),
  created_at     timestamptz not null default now()
);
create index if not exists tasks_team_date_idx on tasks(team_id, scheduled_date);
create index if not exists tasks_assignee_idx  on tasks(assignee_id);
create index if not exists tasks_objective_idx on tasks(objective_id);
-- NOTA: tasks.assignee_id está DEPRECADA — el responsable vive en task_assignees
-- (multi-responsable). Se elimina en la migración de limpieza final.

-- ── task_assignees (varias personas por tarea) ───────────────
create table if not exists task_assignees (
  task_id    uuid not null references tasks(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);
create index if not exists task_assignees_profile_idx on task_assignees(profile_id);
create index if not exists task_assignees_team_idx on task_assignees(team_id);

-- Helper SECURITY DEFINER: evita recursión RLS entre tasks y task_assignees.
-- Solo ejecutable por authenticated (revocado de public/anon).
create or replace function is_task_assignee(t uuid)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (
    select 1 from task_assignees
    where task_id = t and profile_id = auth.uid()
  );
$$;

-- ── kpis (varios KPIs medibles por objetivo) ─────────────────
-- objectives.kpi (texto libre) está DEPRECADA; se migró aquí.
create table if not exists kpis (
  id            uuid primary key default uuid_generate_v4(),
  team_id       uuid not null references teams(id) on delete cascade,
  objective_id  uuid not null references objectives(id) on delete cascade,
  name          text not null,
  target_value  numeric,                    -- null = KPI descriptivo sin meta numérica
  current_value numeric not null default 0,
  unit          text not null default '',
  position      int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists kpis_objective_idx on kpis(objective_id);
create index if not exists kpis_team_idx on kpis(team_id);

-- ── time_sessions (cronómetro, con nombre del usuario) ───────
create table if not exists time_sessions (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references teams(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  task_id    uuid references tasks(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,                               -- NULL = corriendo
  minutes    int                                        -- se calcula al parar
);
create index if not exists time_user_started_idx on time_sessions(user_id, started_at);

-- ── news_entries (libro de novedades) ────────────────────────
create table if not exists news_entries (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references teams(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  project_id uuid references projects(id) on delete set null,
  advances   text[] not null default '{}',
  problem    text,
  next_steps text,
  summary_link text,
  work_link    text,
  for_date   date not null default current_date,
  created_at timestamptz not null default now()
);

-- ── reminders (alarmas — Capa 4) ─────────────────────────────
create table if not exists reminders (
  id        uuid primary key default uuid_generate_v4(),
  team_id   uuid not null references teams(id) on delete cascade,
  task_id   uuid references tasks(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  remind_at timestamptz not null,
  sound     text not null default 'default',
  repeat    text default 'none' check (repeat in ('none','daily','weekly')),
  done      boolean not null default false
);

-- ============================================================
-- ROW LEVEL SECURITY — cada quien ve solo lo de sus equipos
-- ============================================================
alter table profiles           enable row level security;
alter table teams              enable row level security;
alter table team_members       enable row level security;
alter table invites            enable row level security;
alter table company_objectives enable row level security;
alter table projects           enable row level security;
alter table objectives         enable row level security;
alter table tasks              enable row level security;
alter table task_assignees     enable row level security;
alter table kpis               enable row level security;
alter table time_sessions      enable row level security;
alter table news_entries       enable row level security;
alter table reminders          enable row level security;

-- profiles: todos leen perfiles (para mostrar nombres/avatares); cada quien edita el suyo
create policy "profiles_read"  on profiles for select using (true);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- teams: ver/editar si soy miembro; crear si soy el owner
create policy "teams_read"   on teams for select using (is_team_member(id));
create policy "teams_insert" on teams for insert with check (owner_id = auth.uid());

-- team_members: ver miembros de mis equipos.
-- Alta/baja/cambios de rol pasan por RPCs SECURITY DEFINER (invite_member,
-- claim_pending_invites, set_member_role, remove_member): no hay INSERT directo.
create policy "members_read" on team_members for select using (is_team_member(team_id));

-- invites: solo los admin del equipo ven/gestionan sus invitaciones
create policy "invites_select" on invites for select using (is_team_admin(team_id));
create policy "invites_insert" on invites for insert with check (is_team_admin(team_id));
create policy "invites_delete" on invites for delete using (is_team_admin(team_id));

-- Regla por rol: todos los miembros LEEN todo del equipo; gestionar/escribir
-- se limita a admins o al dueño de la fila (assignee/author/user).

-- company_objectives (Metas): leer todos; gestionar solo admin
create policy "company_objectives_select" on company_objectives for select using (is_team_member(team_id));
create policy "company_objectives_insert" on company_objectives for insert with check (is_team_admin(team_id));
create policy "company_objectives_update" on company_objectives for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "company_objectives_delete" on company_objectives for delete using (is_team_admin(team_id));

-- projects: leer todos; crear/editar/borrar solo admin
create policy "projects_select" on projects for select using (is_team_member(team_id));
create policy "projects_insert" on projects for insert with check (is_team_admin(team_id));
create policy "projects_update" on projects for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "projects_delete" on projects for delete using (is_team_admin(team_id));

-- objectives (Objetivos de proyecto): leer todos; gestionar solo admin
create policy "objectives_select" on objectives for select using (is_team_member(team_id));
create policy "objectives_insert" on objectives for insert with check (is_team_admin(team_id));
create policy "objectives_update" on objectives for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "objectives_delete" on objectives for delete using (is_team_admin(team_id));

-- tasks: leer todas; admin gestiona; empleado crea/edita solo lo suyo (assignee)
create policy "tasks_select" on tasks for select using (is_team_member(team_id));
create policy "tasks_insert" on tasks for insert with check (
  is_team_admin(team_id)
  or (created_by = auth.uid() and coalesce(assignee_id, auth.uid()) = auth.uid())
);
create policy "tasks_update" on tasks for update
  using (is_team_admin(team_id) or created_by = auth.uid() or is_task_assignee(id))
  with check (is_team_admin(team_id) or created_by = auth.uid() or is_task_assignee(id));
create policy "tasks_delete" on tasks for delete
  using (is_team_admin(team_id) or created_by = auth.uid());

-- task_assignees: leer todos; admin asigna a cualquiera, miembro solo a sí mismo
create policy "ta_select" on task_assignees for select using (is_team_member(team_id));
create policy "ta_insert" on task_assignees for insert
  with check (is_team_member(team_id) and (is_team_admin(team_id) or profile_id = auth.uid()));
create policy "ta_delete" on task_assignees for delete
  using (is_team_admin(team_id) or profile_id = auth.uid());

-- kpis: leer y actualizar valor todos los miembros; crear/borrar solo admin
create policy "kpis_select" on kpis for select using (is_team_member(team_id));
create policy "kpis_insert" on kpis for insert with check (is_team_admin(team_id));
create policy "kpis_update" on kpis for update
  using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "kpis_delete" on kpis for delete using (is_team_admin(team_id));

-- time_sessions: leer todas (para /tiempos); cada quien escribe las suyas
create policy "time_select" on time_sessions for select using (is_team_member(team_id));
create policy "time_insert" on time_sessions for insert with check (user_id = auth.uid() and is_team_member(team_id));
create policy "time_update" on time_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "time_delete" on time_sessions for delete using (user_id = auth.uid());

-- news_entries: leer todas; escribir las propias; admin borra cualquiera
create policy "news_select" on news_entries for select using (is_team_member(team_id));
create policy "news_insert" on news_entries for insert with check (author_id = auth.uid() and is_team_member(team_id));
create policy "news_update" on news_entries for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "news_delete" on news_entries for delete using (is_team_admin(team_id) or author_id = auth.uid());

-- reminders: todo permitido si soy miembro del equipo
create policy "reminders_all" on reminders
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));

-- ============================================================
-- Realtime: avisar cambios en vivo (Juan ve lo que mueve Salma)
-- ============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table objectives;
alter publication supabase_realtime add table company_objectives;
alter publication supabase_realtime add table news_entries;
alter publication supabase_realtime add table time_sessions;
alter publication supabase_realtime add table task_assignees;
alter publication supabase_realtime add table kpis;
