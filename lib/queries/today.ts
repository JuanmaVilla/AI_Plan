import { cache } from "react";
import { getCurrentProfile } from "@/lib/queries/auth";
import { todayISO, DEFAULT_TIMEZONE } from "@/lib/dates";

/** Zona horaria del usuario logueado (de su perfil). Cacheada por request. */
export const getUserTimezone = cache(async (): Promise<string> => {
  const profile = await getCurrentProfile();
  return profile?.timezone || DEFAULT_TIMEZONE;
});

/**
 * "Hoy" (yyyy-MM-dd) calculado en la zona horaria del usuario. Usar SIEMPRE en
 * el servidor en vez de todayISO() sin zona (el server corre en UTC).
 */
export const getServerToday = cache(async (): Promise<string> => {
  return todayISO(await getUserTimezone());
});
