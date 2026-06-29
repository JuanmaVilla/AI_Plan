import { createClient } from "@/lib/supabase/server";

export type TeamMembership = {
  team_id: string;
  role: string;
};

/** Devuelve la primera membresía de equipo del usuario logueado, o null. */
export async function getMyTeam(): Promise<TeamMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("team_members")
    .select("team_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/**
 * Asegura que el usuario logueado tenga un equipo.
 * Si no pertenece a ninguno, le crea uno y lo mete como `owner`.
 * Idempotente: si ya tiene equipo, no hace nada.
 */
export async function ensureUserHasTeam(): Promise<TeamMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await getMyTeam();
  if (existing) return existing;

  // Nombre del equipo a partir del perfil (o del email).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const owner = profile?.full_name?.trim() || user.email?.split("@")[0] || "yo";
  const teamName = `Equipo de ${owner}`;

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({ name: teamName, owner_id: user.id })
    .select("id")
    .single();

  if (teamError || !team) return null;

  const { error: memberError } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id, role: "owner" });

  if (memberError) return null;

  return { team_id: team.id, role: "owner" };
}
