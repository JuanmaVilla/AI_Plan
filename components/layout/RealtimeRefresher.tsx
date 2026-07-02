"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Escucha cambios en BD y refresca la vista del router.
 * Montado en el layout: los cambios de Juan se ven en el dispositivo de Salma al instante.
 *
 * Notas de rendimiento:
 * - NO escucha `time_sessions`: el cronómetro cuenta en cliente (setInterval en
 *   WorkTimer), así que iniciar/pausar no necesita re-renderizar todo el servidor.
 * - Los refresh se agrupan con debounce: una ráfaga de cambios = un solo refresh.
 */
export function RealtimeRefresher({ teamId }: { teamId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout> | null = null;

    // Agrupa ráfagas de eventos en un único router.refresh().
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), 400);
    };

    const channel = supabase
      .channel(`hay-equipo:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `team_id=eq.${teamId}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects", filter: `team_id=eq.${teamId}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news_entries", filter: `team_id=eq.${teamId}` },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [teamId, router]);

  return null;
}
