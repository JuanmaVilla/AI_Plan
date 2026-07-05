-- ============================================================
-- 2026-07-05 · Editar / eliminar espacios de trabajo (teams)
-- Aplicado en remoto vía MCP: rename_and_delete_workspace_rpcs
-- Renombrar: owner o admin. Borrar: SOLO el dueño y no el único espacio.
-- No hay policy directa update/delete en teams → solo vía estos RPCs.
-- ============================================================

create or replace function public.rename_workspace(t uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare clean text := trim(new_name);
begin
  if not is_team_admin(t) then
    raise exception 'Solo un admin puede renombrar el espacio';
  end if;
  if clean = '' then
    raise exception 'El nombre no puede quedar vacío';
  end if;
  update public.teams set name = clean where id = t;
end;
$$;
revoke execute on function public.rename_workspace(uuid, text) from anon, public;
grant execute on function public.rename_workspace(uuid, text) to authenticated;

-- Borra el espacio completo (cascada por los FK on delete cascade a teams).
-- Solo el DUEÑO; bloqueado si es el único espacio del usuario.
create or replace function public.delete_workspace(t uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  team_count int;
begin
  if not exists (select 1 from public.teams where id = t and owner_id = uid) then
    raise exception 'Solo el dueño puede borrar el espacio';
  end if;
  select count(*) into team_count from public.team_members where user_id = uid;
  if team_count <= 1 then
    raise exception 'No puedes borrar tu único espacio';
  end if;
  delete from public.teams where id = t;
end;
$$;
revoke execute on function public.delete_workspace(uuid) from anon, public;
grant execute on function public.delete_workspace(uuid) to authenticated;
