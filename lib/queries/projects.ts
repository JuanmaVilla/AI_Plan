import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type Project = Tables<"projects">;

/** Proyectos del equipo (no archivados), opcionalmente filtrados por tipo. */
export async function getProjects(
  teamId: string,
  type?: "proyecto" | "objetivo"
): Promise<Project[]> {
  const supabase = await createClient();
  let q = supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .eq("archived", false)
    .order("created_at", { ascending: true });

  if (type) q = q.eq("type", type);

  const { data } = await q;
  return data ?? [];
}

/**
 * Devuelve el proyecto "General" del equipo; si no existe, lo crea.
 * Sirve para que las tareas tengan dónde colgar antes de la Fase 3 (Proyectos).
 */
export async function getOrCreateGeneralProject(teamId: string): Promise<Project | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("projects")
    .select("*")
    .eq("team_id", teamId)
    .eq("name", "General")
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  // El usuario ya es miembro del equipo, así que el insert+select pasa RLS.
  const { data: created } = await supabase
    .from("projects")
    .insert({
      team_id: teamId,
      name: "General",
      type: "proyecto",
      kpi: "",
      icon: "📌",
      created_by: user.id,
    })
    .select("*")
    .single();

  return created ?? null;
}
