import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

/** Usuario logueado (identidad mínima: id + email), suficiente para las queries. */
export type CurrentUser = { id: string; email: string | null };

/**
 * Usuario logueado. Cacheado por request (React cache):
 * aunque se llame en el layout y en varias queries, valida la sesión UNA vez.
 *
 * Usa getClaims() (verificación local del JWT con claves asimétricas) en vez de
 * getUser() para evitar un viaje de red a Supabase en cada render.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
});

/** Perfil del usuario logueado, cacheado por request. */
export const getCurrentProfile = cache(async (): Promise<Tables<"profiles"> | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data ?? null;
});
