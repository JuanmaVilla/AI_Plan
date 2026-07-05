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
    let pending = false;

    // Agrupa ráfagas de eventos en un único router.refresh(). Si la pestaña está
    // en segundo plano, no refrescamos (gasto inútil): dejamos pendiente y
    // refrescamos al volver a la pestaña.
    const doRefresh = () => {
      if (document.hidden) {
        pending = true;
        return;
      }
      pending = false;
      router.refresh();
    };
    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(doRefresh, 900);
    };
    const onVisible = () => {
      if (!document.hidden && pending) doRefresh();
    };
    document.addEventListener("visibilitychange", onVisible);

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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_assignees", filter: `team_id=eq.${teamId}` },
        scheduleRefresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kpis", filter: `team_id=eq.${teamId}` },
        scheduleRefresh
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [teamId, router]);

  return null;
}
