-- ============================================================
-- Jerarquía real: Metas (company_objectives) → Proyectos → Objetivos → Tareas.
-- Antes proyecto y objetivo eran la misma tabla (projects.type). Ahora:
--   * company_objectives (Metas de empresa)
--   * projects apunta opcionalmente a una Meta (company_objective_id)
--   * objectives (objetivos de proyecto, con KPI) cuelgan de un project
--   * tasks cuelgan de un objective (estricto)
-- Datos de prueba: se resetean tasks y projects.
-- ============================================================

-- ── Metas de empresa ─────────────────────────────────────────
create table if not exists public.company_objectives (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  name        text not null,
  kpi         text not null default '',
  target_date date,
  color       text not null default '#0057FF',
  icon        text not null default '🏁',
  archived    boolean not null default false,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ── Objetivos de proyecto ────────────────────────────────────
create table if not exists public.objectives (
  id          uuid primary key default uuid_generate_v4(),
  team_id     uuid not null references public.teams(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  name        text not null,
  kpi         text not null default '',
  target_date date,
  color       text not null default '#0057FF',
  icon        text not null default '🎯',
  archived    boolean not null default false,
  created_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists objectives_project_idx on public.objectives(project_id);

-- ── projects: quitar type/kpi, apuntar a una Meta ────────────
alter table public.projects drop column if exists type;
alter table public.projects drop column if exists kpi;
alter table public.projects
  add column if not exists company_objective_id uuid references public.company_objectives(id) on delete set null;

-- ── Reset de datos de prueba y recableado de tasks ───────────
-- DELETE (no TRUNCATE) para respetar el on-delete de time_sessions (set null).
delete from public.tasks;
delete from public.projects;

alter table public.tasks drop column if exists project_id;
alter table public.tasks
  add column objective_id uuid not null references public.objectives(id) on delete cascade;
create index if not exists tasks_objective_idx on public.tasks(objective_id);

-- ============================================================
-- RLS: leer si sos miembro; crear/editar/borrar solo admin
-- (mismo patrón que projects).
-- ============================================================
alter table public.company_objectives enable row level security;
alter table public.objectives         enable row level security;

drop policy if exists "company_objectives_select" on public.company_objectives;
drop policy if exists "company_objectives_insert" on public.company_objectives;
drop policy if exists "company_objectives_update" on public.company_objectives;
drop policy if exists "company_objectives_delete" on public.company_objectives;
create policy "company_objectives_select" on public.company_objectives for select using (is_team_member(team_id));
create policy "company_objectives_insert" on public.company_objectives for insert with check (is_team_admin(team_id));
create policy "company_objectives_update" on public.company_objectives for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "company_objectives_delete" on public.company_objectives for delete using (is_team_admin(team_id));

drop policy if exists "objectives_select" on public.objectives;
drop policy if exists "objectives_insert" on public.objectives;
drop policy if exists "objectives_update" on public.objectives;
drop policy if exists "objectives_delete" on public.objectives;
create policy "objectives_select" on public.objectives for select using (is_team_member(team_id));
create policy "objectives_insert" on public.objectives for insert with check (is_team_admin(team_id));
create policy "objectives_update" on public.objectives for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "objectives_delete" on public.objectives for delete using (is_team_admin(team_id));

-- Realtime en vivo
alter publication supabase_realtime add table public.objectives;
alter publication supabase_realtime add table public.company_objectives;
