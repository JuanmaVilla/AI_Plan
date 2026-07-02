"use server";

import { createClient } from "@/lib/supabase/server";
import { getMyTeam } from "@/lib/queries/teams";
import { getTeamMembers } from "@/lib/queries/members";
import { roleLabel } from "@/lib/roles";

export type SearchResult = {
  type: "proyecto" | "objetivo" | "meta" | "tarea" | "persona";
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  href: string;
};

/** Busca en proyectos, objetivos, metas y tareas del espacio activo. */
export async function searchAction(query: string): Promise<SearchResult[]> {
  // Sacamos caracteres que rompen el filtro .or() de PostgREST.
  const q = query.trim().replace(/[,()%*]/g, "");
  if (q.length < 1) return [];

  const team = await getMyTeam();
  if (!team) return [];

  const supabase = await createClient();
  const like = `%${q}%`;
  const tid = team.team_id;

  const [projects, objectives, metas, tasks] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, icon")
      .eq("team_id", tid)
      .eq("archived", false)
      .ilike("name", like)
      .limit(5),
    supabase
      .from("objectives")
      .select("id, name, icon, kpi, project_id, project:projects!objectives_project_id_fkey(name)")
      .eq("team_id", tid)
      .eq("archived", false)
      .or(`name.ilike.${like},kpi.ilike.${like}`)
      .limit(5),
    supabase
      .from("company_objectives")
      .select("id, name, icon, kpi")
      .eq("team_id", tid)
      .eq("archived", false)
      .or(`name.ilike.${like},kpi.ilike.${like}`)
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, objective:objectives!tasks_objective_id_fkey(name, project_id)")
      .eq("team_id", tid)
      .ilike("title", like)
      .limit(8),
  ]);

  // Personas del equipo (se filtran en memoria por nombre).
  const members = await getTeamMembers(tid);
  const ql = q.toLowerCase();

  const results: SearchResult[] = [];

  for (const m of members) {
    if (!m.full_name.toLowerCase().includes(ql)) continue;
    results.push({
      type: "persona",
      id: m.id,
      label: m.full_name,
      sublabel: roleLabel(m.role),
      icon: "👤",
      href: "/equipo",
    });
  }

  for (const p of projects.data ?? []) {
    results.push({
      type: "proyecto",
      id: p.id,
      label: p.name,
      icon: p.icon || "📁",
      href: `/proyectos/${p.id}`,
    });
  }

  for (const o of objectives.data ?? []) {
    const proj = o.project as unknown as { name: string } | null;
    results.push({
      type: "objetivo",
      id: o.id,
      label: o.name,
      sublabel: proj?.name ? `en ${proj.name}` : o.kpi || undefined,
      icon: o.icon || "🎯",
      href: `/proyectos/${o.project_id}`,
    });
  }

  for (const m of metas.data ?? []) {
    results.push({
      type: "meta",
      id: m.id,
      label: m.name,
      sublabel: m.kpi || undefined,
      icon: m.icon || "🏁",
      href: `/metas`,
    });
  }

  for (const t of tasks.data ?? []) {
    const obj = t.objective as unknown as { name: string; project_id: string } | null;
    results.push({
      type: "tarea",
      id: t.id,
      label: t.title,
      sublabel: obj?.name ? `objetivo: ${obj.name}` : undefined,
      icon: "✅",
      href: obj?.project_id ? `/proyectos/${obj.project_id}` : "/hoy",
    });
  }

  return results;
}
