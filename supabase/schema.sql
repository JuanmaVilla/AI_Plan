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

-- ── projects (proyectos y objetivos) ─────────────────────────
create table if not exists projects (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references teams(id) on delete cascade,
  name       text not null,
  type       text not null default 'proyecto' check (type in ('proyecto','objetivo')),
  kpi        text not null default '',
  color      text not null default '#0057FF',
  icon       text not null default '📌',
  archived   boolean not null default false,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ── tasks ────────────────────────────────────────────────────
create table if not exists tasks (
  id             uuid primary key default uuid_generate_v4(),
  team_id        uuid not null references teams(id) on delete cascade,
  project_id     uuid not null references projects(id) on delete cascade,
  title          text not null,
  assignee_id    uuid references profiles(id),          -- NULL = sin asignar
  scheduled_date date,                                  -- NULL = backlog
  progress       int not null default 0 check (progress between 0 and 100),
  note           text not null default '',
  created_by     uuid not null references profiles(id),
  created_at     timestamptz not null default now()
);
create index if not exists tasks_team_date_idx on tasks(team_id, scheduled_date);
create index if not exists tasks_assignee_idx  on tasks(assignee_id);

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
alter table profiles      enable row level security;
alter table teams         enable row level security;
alter table team_members  enable row level security;
alter table projects      enable row level security;
alter table tasks         enable row level security;
alter table time_sessions enable row level security;
alter table news_entries  enable row level security;
alter table reminders     enable row level security;

-- profiles: todos leen perfiles (para mostrar nombres/avatares); cada quien edita el suyo
create policy "profiles_read"  on profiles for select using (true);
create policy "profiles_update" on profiles for update using (id = auth.uid());

-- teams: ver/editar si soy miembro; crear si soy el owner
create policy "teams_read"   on teams for select using (is_team_member(id));
create policy "teams_insert" on teams for insert with check (owner_id = auth.uid());

-- team_members: ver miembros de mis equipos
create policy "members_read"   on team_members for select using (is_team_member(team_id));
create policy "members_insert" on team_members for insert with check (is_team_member(team_id) or user_id = auth.uid());

-- Patrón para tablas con team_id: todo permitido SOLO si soy miembro del equipo
create policy "projects_all" on projects
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "tasks_all" on tasks
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "time_all" on time_sessions
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "news_all" on news_entries
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "reminders_all" on reminders
  for all using (is_team_member(team_id)) with check (is_team_member(team_id));

-- ============================================================
-- Realtime: avisar cambios en vivo (Juan ve lo que mueve Salma)
-- ============================================================
alter publication supabase_realtime add table tasks;
alter publication supabase_realtime add table projects;
alter publication supabase_realtime add table news_entries;
alter publication supabase_realtime add table time_sessions;
