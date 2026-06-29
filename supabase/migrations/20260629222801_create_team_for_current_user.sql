-- create_team_for_current_user: crea team + membresía owner de forma atómica.
-- SECURITY DEFINER evita el rollback por RLS al leer el team recién creado.
-- Idempotente: si el usuario ya pertenece a un equipo, devuelve ese (evita duplicados por carreras).
create or replace function public.create_team_for_current_user(team_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  new_team_id uuid;
  existing_team_id uuid;
begin
  if uid is null then
    raise exception 'No hay usuario autenticado';
  end if;

  select team_id into existing_team_id
  from public.team_members
  where user_id = uid
  limit 1;

  if existing_team_id is not null then
    return existing_team_id;
  end if;

  insert into public.teams (name, owner_id)
  values (coalesce(nullif(trim(team_name), ''), 'Mi equipo'), uid)
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, uid, 'owner');

  return new_team_id;
end;
$$;

revoke execute on function public.create_team_for_current_user(text) from anon, public;
grant execute on function public.create_team_for_current_user(text) to authenticated;
