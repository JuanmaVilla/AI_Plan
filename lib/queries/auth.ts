import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

/**
 * Usuario logueado. Cacheado por request (React cache):
 * aunque se llame en el layout y en varias queries, valida la sesión UNA vez.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
