import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, getCurrentProfile } from "@/lib/queries/auth";

export type TeamMembership = {
  team_id: string;
  role: string;
};

/**
 * Primera membresía de equipo del usuario logueado, o null.
 * Cacheado por request: layout y páginas comparten la misma consulta.
 */
export const getMyTeam = cache(async (): Promise<TeamMembership | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data ?? null;
});

/**
 * Asegura que el usuario logueado tenga un equipo.
 * Si no pertenece a ninguno, le crea uno y lo mete como `owner`.
 * Idempotente: si ya tiene equipo, no hace nada.
 */
export async function ensureUserHasTeam(): Promise<TeamMembership | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const existing = await getMyTeam();
  if (existing) return existing;

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
