import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/queries/auth";

export type TeamMembership = {
  team_id: string;
  role: string;
};

/** Espacio de trabajo del usuario: membresía + nombre del equipo. */
export type Workspace = {
  team_id: string;
  role: string;
  name: string;
};

/** Nombre de la cookie que guarda el espacio de trabajo activo. */
export const ACTIVE_TEAM_COOKIE = "active_team_id";

/**
 * Todos los espacios de trabajo del usuario logueado (con nombre), ordenados
 * por antigüedad. Cacheado por request.
 */
export const getMyTeams = cache(async (): Promise<Workspace[]> => {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("team_id, role, team:teams!team_members_team_id_fkey(name, created_at)")
    .eq("user_id", user.id);

  return (data ?? [])
    .map((row) => {
      const t = row.team as unknown as { name: string; created_at: string } | null;
      return { team_id: row.team_id, role: row.role, name: t?.name ?? "Espacio", created_at: t?.created_at ?? "" };
    })
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ team_id, role, name }) => ({ team_id, role, name }));
});

/**
 * Espacio de trabajo ACTIVO del usuario. Lee la cookie `active_team_id`;
 * si no existe o ya no es válida, cae al primero. Cacheado por request:
 * layout y páginas comparten la misma consulta.
 *
 * Nota: todas las páginas/acciones usan este helper, así que respetan
 * automáticamente el espacio activo sin cambios en cada llamada.
 */
export const getMyTeam = cache(async (): Promise<TeamMembership | null> => {
  const teams = await getMyTeams();
  if (teams.length === 0) return null;

  const store = await cookies();
  const activeId = store.get(ACTIVE_TEAM_COOKIE)?.value;
  const active = activeId ? teams.find((t) => t.team_id === activeId) : undefined;
  const chosen = active ?? teams[0];

  return { team_id: chosen.team_id, role: chosen.role };
});

/**
 * Asegura que el usuario logueado tenga un equipo.
 * Si no pertenece a ninguno, le crea uno y lo mete como `owner`.
 * Idempotente: si ya tiene equipo, no hace nada.
 */
export async function ensureUserHasTeam(): Promise<TeamMembership | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const teams = await getMyTeams();
  if (teams.length > 0) return { team_id: teams[0].team_id, role: teams[0].role };

  // Nombre del equipo a partir del perfil (o del email).
  const profile = await getCurrentProfile();
  const owner = profile?.full_name?.trim() || user.email?.split("@")[0] || "yo";
  const teamName = `Equipo de ${owner}`;

  const supabase = await createClient();

  // Crea team + membresía de forma atómica (función SECURITY DEFINER en la BD).
  // Evita el rollback por RLS al intentar leer el team recién creado.
  const { data: teamId, error } = await supabase.rpc(
    "create_team_for_current_user",
    { team_name: teamName }
  );

  if (error || !teamId) return null;

  return { team_id: teamId, role: "owner" };
}
