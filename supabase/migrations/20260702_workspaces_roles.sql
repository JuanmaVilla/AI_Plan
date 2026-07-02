-- ============================================================
-- Espacios de trabajo, roles (admin/empleado) e invitaciones.
--   * is_team_admin(t): helper de rol para las políticas.
--   * invites: invitar por email; se resuelven al registrarse.
--   * RPCs SECURITY DEFINER: crear espacio, invitar, cambiar rol,
--     quitar miembro, reclamar invitaciones pendientes.
--   * RLS más fina por rol (empleado ve todo, gestiona solo lo suyo).
-- ============================================================

-- ── Helper: ¿el usuario actual es admin (owner/admin) de este equipo? ──
create or replace function public.is_team_admin(t uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.team_members
    where team_id = t and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;
revoke execute on function public.is_team_admin(uuid) from anon, public;
grant execute on function public.is_team_admin(uuid) to authenticated;

-- ── invites: invitaciones por email ──────────────────────────
create table if not exists public.invites (
  id         uuid primary key default uuid_generate_v4(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  email      text not null,
  role       text not null default 'member' check (role in ('admin', 'member')),
  invited_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (team_id, email)
);
alter table public.invites enable row level security;

drop policy if exists "invites_select" on public.invites;
drop policy if exists "invites_insert" on public.invites;
drop policy if exists "invites_delete" on public.invites;
create policy "invites_select" on public.invites for select using (is_team_admin(team_id));
create policy "invites_insert" on public.invites for insert with check (is_team_admin(team_id));
create policy "invites_delete" on public.invites for delete using (is_team_admin(team_id));

-- ── RPC: crear un NUEVO espacio de trabajo (no idempotente) ──
-- create_team_for_current_user es idempotente (para el auto-equipo del primer
-- login). Este siempre crea uno nuevo, para el botón "Crear espacio".
create or replace function public.create_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  new_team_id uuid;
begin
  if uid is null then
    raise exception 'No hay usuario autenticado';
  end if;

  insert into public.teams (name, owner_id)
  values (coalesce(nullif(trim(workspace_name), ''), 'Nuevo espacio'), uid)
  returning id into new_team_id;

  insert into public.team_members (team_id, user_id, role)
  values (new_team_id, uid, 'owner');

  return new_team_id;
end;
$$;
revoke execute on function public.create_workspace(text) from anon, public;
grant execute on function public.create_workspace(text) to authenticated;

-- ── RPC: invitar a alguien por email ─────────────────────────
-- Si ya tiene cuenta, se añade al instante. Si no, queda en invites y
-- entra solo al registrarse (ver claim_pending_invites).
-- Devuelve 'added' | 'invited' | 'exists'.
create or replace function public.invite_member(t uuid, invite_email text, invite_role text)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_uid uuid;
  clean_email text := lower(trim(invite_email));
  safe_role text := case when invite_role = 'admin' then 'admin' else 'member' end;
begin
  if not is_team_admin(t) then
    raise exception 'Solo un admin puede invitar';
  end if;
  if clean_email = '' then
    raise exception 'Email vacío';
  end if;

  select id into target_uid from auth.users where lower(email) = clean_email limit 1;

  if target_uid is not null then
    if exists (select 1 from public.team_members where team_id = t and user_id = target_uid) then
      return 'exists';
    end if;
    insert into public.team_members (team_id, user_id, role)
    values (t, target_uid, safe_role);
    return 'added';
  end if;

  insert into public.invites (team_id, email, role, invited_by)
  values (t, clean_email, safe_role, auth.uid())
  on conflict (team_id, email) do update set role = excluded.role;
  return 'invited';
end;
$$;
revoke execute on function public.invite_member(uuid, text, text) from anon, public;
grant execute on function public.invite_member(uuid, text, text) to authenticated;

-- ── RPC: reclamar invitaciones pendientes del usuario actual ──
-- Se llama en el layout al entrar. Empareja el email del usuario con
-- invites pendientes, crea la membresía y borra la invitación.
create or replace function public.claim_pending_invites()
returns int
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  my_email text;
  claimed int := 0;
begin
  if uid is null then
    return 0;
  end if;

  select lower(email) into my_email from auth.users where id = uid;
  if my_email is null then
    return 0;
  end if;

  insert into public.team_members (team_id, user_id, role)
  select i.team_id, uid, i.role
  from public.invites i
  where lower(i.email) = my_email
  on conflict (team_id, user_id) do nothing;

  delete from public.invites where lower(email) = my_email;
  get diagnostics claimed = row_count;
  return claimed;
end;
$$;
revoke execute on function public.claim_pending_invites() from anon, public;
grant execute on function public.claim_pending_invites() to authenticated;

-- ── RPC: cambiar el rol de un miembro (solo admin; no toca owners) ──
create or replace function public.set_member_role(t uuid, target uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  safe_role text := case when new_role = 'admin' then 'admin' else 'member' end;
  current_role text;
begin
  if not is_team_admin(t) then
    raise exception 'Solo un admin puede cambiar roles';
  end if;

  select role into current_role from public.team_members
  where team_id = t and user_id = target;
  if current_role is null then
    raise exception 'El miembro no existe en este espacio';
  end if;
  if current_role = 'owner' then
    raise exception 'No se puede cambiar el rol del dueño';
  end if;

  update public.team_members set role = safe_role
  where team_id = t and user_id = target;
end;
$$;
revoke execute on function public.set_member_role(uuid, uuid, text) from anon, public;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;

-- ── RPC: quitar a un miembro (solo admin; no al dueño) ──
create or replace function public.remove_member(t uuid, target uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_role text;
begin
  if not is_team_admin(t) then
    raise exception 'Solo un admin puede quitar miembros';
  end if;

  select role into current_role from public.team_members
  where team_id = t and user_id = target;
  if current_role = 'owner' then
    raise exception 'No se puede quitar al dueño del espacio';
  end if;

  delete from public.team_members where team_id = t and user_id = target;
end;
$$;
revoke execute on function public.remove_member(uuid, uuid) from anon, public;
grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- ============================================================
-- RLS más fina por rol. Reemplaza las políticas "*_all" permisivas.
-- Regla: todos los miembros LEEN todo del equipo; escribir/gestionar
-- se limita a admins o al dueño de la fila (assignee/author/user).
-- ============================================================

-- ── projects: leer todos; crear/editar/borrar solo admin ──
drop policy if exists "projects_all" on public.projects;
create policy "projects_select" on public.projects for select using (is_team_member(team_id));
create policy "projects_insert" on public.projects for insert with check (is_team_admin(team_id));
create policy "projects_update" on public.projects for update using (is_team_admin(team_id)) with check (is_team_admin(team_id));
create policy "projects_delete" on public.projects for delete using (is_team_admin(team_id));

-- ── tasks: leer todas; admin gestiona; empleado edita/crea solo lo suyo ──
drop policy if exists "tasks_all" on public.tasks;
create policy "tasks_select" on public.tasks for select using (is_team_member(team_id));
create policy "tasks_insert" on public.tasks for insert with check (
  is_team_admin(team_id)
  or (created_by = auth.uid() and coalesce(assignee_id, auth.uid()) = auth.uid())
);
-- USING: admin, o soy el responsable actual. WITH CHECK: tras el cambio sigo
-- siendo admin o el responsable (bloquea que un empleado reasigne a otro).
create policy "tasks_update" on public.tasks for update
  using (is_team_admin(team_id) or assignee_id = auth.uid())
  with check (is_team_admin(team_id) or assignee_id = auth.uid());
create policy "tasks_delete" on public.tasks for delete
  using (is_team_admin(team_id) or created_by = auth.uid());

-- ── time_sessions: leer todas (para /tiempos); cada quien escribe las suyas ──
drop policy if exists "time_all" on public.time_sessions;
create policy "time_select" on public.time_sessions for select using (is_team_member(team_id));
create policy "time_insert" on public.time_sessions for insert with check (user_id = auth.uid() and is_team_member(team_id));
create policy "time_update" on public.time_sessions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "time_delete" on public.time_sessions for delete using (user_id = auth.uid());

-- ── news_entries: leer todas; escribir las propias; admin borra cualquiera ──
drop policy if exists "news_all" on public.news_entries;
create policy "news_select" on public.news_entries for select using (is_team_member(team_id));
create policy "news_insert" on public.news_entries for insert with check (author_id = auth.uid() and is_team_member(team_id));
create policy "news_update" on public.news_entries for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "news_delete" on public.news_entries for delete using (is_team_admin(team_id) or author_id = auth.uid());

-- ── team_members: quitar el INSERT directo permisivo ──
-- Alta/baja/cambios ahora pasan por los RPCs SECURITY DEFINER de arriba.
drop policy if exists "members_insert" on public.team_members;
