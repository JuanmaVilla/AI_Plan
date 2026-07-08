-- H5: garantiza UNA sola sesión de cronómetro abierta por usuario (a nivel BD).
-- Elimina la carrera check-then-insert de startSession.
create unique index if not exists time_sessions_one_active_per_user
  on time_sessions (user_id)
  where ended_at is null;

-- H4: archivar objetivo de forma ATÓMICA (borra tareas + archiva objetivo).
-- SECURITY DEFINER: replica la política RLS (solo admin del equipo del objetivo).
create or replace function archive_objective(obj uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid;
begin
  select team_id into t from objectives where id = obj;
  if t is null then
    raise exception 'objective not found';
  end if;
  if not is_team_admin(t) then
    raise exception 'not authorized';
  end if;
  delete from tasks where objective_id = obj;
  update objectives set archived = true where id = obj;
end;
$$;

-- H4: archivar proyecto en cascada de forma ATÓMICA
-- (borra tareas de sus objetivos, archiva objetivos y proyecto).
create or replace function archive_project_cascade(proj uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t uuid;
begin
  select team_id into t from projects where id = proj;
  if t is null then
    raise exception 'project not found';
  end if;
  if not is_team_admin(t) then
    raise exception 'not authorized';
  end if;
  delete from tasks
    where objective_id in (select id from objectives where project_id = proj);
  update objectives set archived = true where project_id = proj;
  update projects set archived = true where id = proj;
end;
$$;

revoke all on function archive_objective(uuid) from public, anon;
revoke all on function archive_project_cascade(uuid) from public, anon;
grant execute on function archive_objective(uuid) to authenticated;
grant execute on function archive_project_cascade(uuid) to authenticated;
