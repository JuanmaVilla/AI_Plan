import { cookies } from "next/headers";

/**
 * Vista de las pantallas Hoy y Semana (independiente del filtro global "solo lo mío"):
 * - "mine": solo mis tareas del espacio activo.
 * - "team": mis tareas y las del equipo, del espacio activo.
 * - "mine_all": solo mis tareas, juntando los espacios elegidos (hs_spaces).
 */
export type HsView = "mine" | "team" | "mine_all";

export const HS_VIEW_COOKIE = "hs_view";
export const HS_SPACES_COOKIE = "hs_spaces";

/** Resuelve la vista a (espacios a consultar, filtro mío). Lógica pura. */
export function resolveHsView(
  view: HsView,
  activeTeamId: string,
  allTeamIds: string[],
  selectedSpaces: string[] | null,
  uid: string
): { teamIds: string[]; mineUid: string | null; multiSpace: boolean } {
  if (view === "team") {
    return { teamIds: [activeTeamId], mineUid: null, multiSpace: false };
  }
  if (view === "mine_all") {
    const chosen = selectedSpaces
      ? allTeamIds.filter((id) => selectedSpaces.includes(id))
      : allTeamIds;
    const teamIds = chosen.length > 0 ? chosen : [activeTeamId];
    return { teamIds, mineUid: uid, multiSpace: teamIds.length > 1 };
  }
  // "mine" (default): solo yo, espacio activo.
  return { teamIds: [activeTeamId], mineUid: uid, multiSpace: false };
}

/** Lee la vista activa de Hoy/Semana. Por defecto "mine". */
export async function getHsView(): Promise<HsView> {
  const v = (await cookies()).get(HS_VIEW_COOKIE)?.value;
  return v === "team" || v === "mine_all" ? v : "mine";
}

/**
 * IDs de espacios elegidos para la vista "mine_all". null = todos (sin filtrar).
 * Se guarda como lista separada por comas.
 */
export async function getHsSpaces(): Promise<string[] | null> {
  const raw = (await cookies()).get(HS_SPACES_COOKIE)?.value;
  if (!raw) return null;
  const ids = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return ids.length > 0 ? ids : null;
}
