"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getMyTeam, getMyTeams, ACTIVE_TEAM_COOKIE } from "@/lib/queries/teams";
import { VIEW_SCOPE_COOKIE, type ViewScope } from "@/lib/queries/scope";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

/** Cambia el espacio de trabajo activo (guarda la cookie y refresca todo). */
export async function setActiveWorkspaceAction(teamId: string) {
  const teams = await getMyTeams();
  if (!teams.some((t) => t.team_id === teamId)) {
    return { ok: false as const, error: "No perteneces a ese espacio." };
  }
  const store = await cookies();
  store.set(ACTIVE_TEAM_COOKIE, teamId, { path: "/", maxAge: COOKIE_MAX_AGE });
  revalidatePath("/", "layout");
  return { ok: true as const };
}

/** Crea un nuevo espacio de trabajo y lo deja como activo. */
export async function createWorkspaceAction(name: string) {
  const clean = name.trim();
  if (!clean) return { ok: false as const, error: "Ponle un nombre al espacio." };

  const supabase = await createClient();
  const { data: teamId, error } = await supabase.rpc("create_workspace", {
    workspace_name: clean,
  });
  if (error || !teamId) return { ok: false as const, error: "No se pudo crear el espacio." };

  const store = await cookies();
  store.set(ACTIVE_TEAM_COOKIE, teamId, { path: "/", maxAge: COOKIE_MAX_AGE });
  revalidatePath("/", "layout");
  return { ok: true as const, teamId };
}

/** Invita a alguien por email al espacio activo (solo admin; validado en la BD). */
export async function inviteMemberAction(email: string, role: "admin" | "member") {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes("@")) {
    return { ok: false as const, error: "Escribe un email válido." };
  }
  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tienes espacio activo." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("invite_member", {
    t: team.team_id,
    invite_email: clean,
    invite_role: role,
  });
  if (error) return { ok: false as const, error: "No se pudo invitar. ¿Eres admin?" };

  revalidatePath("/equipo");
  return { ok: true as const, status: data as "added" | "invited" | "exists" };
}

/** Cambia el rol de un miembro del espacio activo (solo admin; validado en la BD). */
export async function setMemberRoleAction(userId: string, role: "admin" | "member") {
  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tienes espacio activo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", {
    t: team.team_id,
    target: userId,
    new_role: role,
  });
  if (error) return { ok: false as const, error: "No se pudo cambiar el rol." };

  revalidatePath("/equipo");
  return { ok: true as const };
}

/** Quita a un miembro del espacio activo (solo admin; validado en la BD). */
export async function removeMemberAction(userId: string) {
  const team = await getMyTeam();
  if (!team) return { ok: false as const, error: "No tienes espacio activo." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", {
    t: team.team_id,
    target: userId,
  });
  if (error) return { ok: false as const, error: "No se pudo quitar al miembro." };

  revalidatePath("/equipo");
  return { ok: true as const };
}

/** Cancela una invitación pendiente (solo admin; RLS lo valida). */
export async function cancelInviteAction(inviteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);
  if (error) return { ok: false as const, error: "No se pudo cancelar la invitación." };

  revalidatePath("/equipo");
  return { ok: true as const };
}

/** Guarda el filtro "solo lo mío" (cookie global) y refresca todo. */
export async function setViewScopeAction(scope: ViewScope) {
  const store = await cookies();
  store.set(VIEW_SCOPE_COOKIE, scope, { path: "/", maxAge: COOKIE_MAX_AGE });
  revalidatePath("/", "layout");
  return { ok: true as const };
}
