"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { HS_VIEW_COOKIE, HS_SPACES_COOKIE, type HsView } from "@/lib/queries/hsView";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

/** Cambia la vista de Hoy/Semana (mine / team / mine_all). */
export async function setHsViewAction(view: HsView) {
  const store = await cookies();
  store.set(HS_VIEW_COOKIE, view, { path: "/", maxAge: COOKIE_MAX_AGE });
  revalidatePath("/hoy");
  revalidatePath("/semana");
  return { ok: true as const };
}

/** Elige de qué espacios ver en la vista "mine_all" (lista de team_id). */
export async function setHsSpacesAction(teamIds: string[]) {
  const store = await cookies();
  if (teamIds.length === 0) store.delete(HS_SPACES_COOKIE);
  else store.set(HS_SPACES_COOKIE, teamIds.join(","), { path: "/", maxAge: COOKIE_MAX_AGE });
  revalidatePath("/hoy");
  revalidatePath("/semana");
  return { ok: true as const };
}
