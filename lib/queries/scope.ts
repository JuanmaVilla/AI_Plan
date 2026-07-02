import { cookies } from "next/headers";

/** Filtro global de visibilidad: "mine" = solo lo mío, "all" = todo el equipo. */
export type ViewScope = "mine" | "all";

/** Nombre de la cookie del filtro "solo lo mío". */
export const VIEW_SCOPE_COOKIE = "view_scope";

/** Lee el filtro activo desde la cookie. Por defecto "all" (ver todo). */
export async function getViewScope(): Promise<ViewScope> {
  const store = await cookies();
  return store.get(VIEW_SCOPE_COOKIE)?.value === "mine" ? "mine" : "all";
}
