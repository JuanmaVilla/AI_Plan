-- ============================================================
-- 2026-07-04 · Lote: multi-responsable, KPIs medibles, avatar
-- Aplicado en remoto vía MCP como 3+1 migraciones:
--   task_assignees_multi_responsable
--   kpis_measurable_per_objective
--   profiles_avatar_url_and_storage
--   harden_is_task_assignee_and_avatars_bucket
-- Este archivo las espeja para documentación local.
-- ============================================================

-- ------------------------------------------------------------
-- 1) task_assignees: una tarea puede tener varias personas.
--    tasks.assignee_id queda deprecada (se elimina cuando el
--    código deje de leerla, en la migración de limpieza final).
-- ------------------------------------------------------------
create table task_assignees (
  task_id    uuid not null references tasks(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  team_id    uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

create index task_assignees_profile_idx on task_assignees(profile_id);
create index task_assignees_team_idx on task_assignees(team_id);

alter table task_assignees enable row level security;

-- Helper SECURITY DEFINER: evita recursión RLS entre tasks y task_assignees.
create or replace function is_task_assignee(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from task_assignees
    where task_id = t and profile_id = auth.uid()
  );
$$;

revoke execute on function is_task_assignee(uuid) from public;
revoke execute on function is_task_assignee(uuid) from anon;
grant execute on function is_task_assignee(uuid) to authenticated;

-- Leer: cualquier miembro. Asignar: admin a cualquiera; miembro solo a sí mismo.
create policy "ta_select" on task_assignees for select using (is_team_member(team_id));
create policy "ta_insert" on task_assignees for insert
  with check (is_team_member(team_id) and (is_team_admin(team_id) or profile_id = auth.uid()));
create policy "ta_delete" on task_assignees for delete
  using (is_team_admin(team_id) or profile_id = auth.uid());

-- Backfill: copiar el responsable único actual a la tabla nueva.
insert into task_assignees (task_id, profile_id, team_id)
select id, assignee_id, team_id from tasks where assignee_id is not null
on conflict do nothing;

-- tasks_update ahora reconoce a cualquier asignado (o admin, o creador).
drop policy "tasks_update" on tasks;
create policy "tasks_update" on tasks for update
  using (is_team_admin(team_id) or created_by = auth.uid() or is_task_assignee(id))
  with check (is_team_admin(team_id) or created_by = auth.uid() or is_task_assignee(id));

alter publication supabase_realtime add table task_assignees;

-- ------------------------------------------------------------
-- 2) kpis: varios KPIs medibles por objetivo (meta + valor actual).
--    objectives.kpi (texto libre) queda deprecada.
-- ------------------------------------------------------------
create table kpis (
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

create index kpis_objective_idx on kpis(objective_id);
create index kpis_team_idx on kpis(team_id);

alter table kpis enable row level security;

-- Leer y actualizar valor: todos los miembros. Crear/borrar: solo admin.
create policy "kpis_select" on kpis for select using (is_team_member(team_id));
create policy "kpis_insert" on kpis for insert with check (is_team_admin(team_id));
create policy "kpis_update" on kpis for update
  using (is_team_member(team_id)) with check (is_team_member(team_id));
create policy "kpis_delete" on kpis for delete using (is_team_admin(team_id));

alter publication supabase_realtime add table kpis;

-- Migrar el texto libre existente: 1 fila por objetivo con kpi no vacío.
insert into kpis (team_id, objective_id, name)
select team_id, id, kpi from objectives where kpi <> '';

-- ------------------------------------------------------------
-- 3) Foto de perfil: profiles.avatar_url + bucket público 'avatars'.
--    Ruta: {user_id}/avatar.{ext} — cada quien escribe solo su carpeta.
--    Sin policy de SELECT: el bucket es público (URL directa) y una
--    policy amplia permitiría listar todos los archivos.
-- ------------------------------------------------------------
alter table profiles add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
