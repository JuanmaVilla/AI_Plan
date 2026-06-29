-- Fija search_path (silencia function_search_path_mutable) y endurece grants.
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.is_team_member(uuid) set search_path = public, pg_temp;

-- handle_new_user es trigger-only: no debe ser invocable via REST RPC.
revoke execute on function public.handle_new_user() from anon, authenticated;
-- is_team_member se mantiene ejecutable: las políticas RLS la invocan como rol authenticated.
