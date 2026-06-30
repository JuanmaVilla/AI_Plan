import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { todayISO } from "@/lib/dates";

export type TimeSession = Tables<"time_sessions">;

/** Sesión activa del usuario (ended_at IS NULL). Una sola a la vez. */
export async function getActiveSession(userId: string): Promise<TimeSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_sessions")
    .select("*")
    .eq("user_id", userId)
    .is("ended_at", null)
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

/** Minutos registrados hoy por tarea (sesiones ya cerradas). */
export async function getTasksMinutesToday(
  teamId: string,
  userId: string
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_sessions")
    .select("task_id, minutes")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("started_at", todayISO() + "T00:00:00")
    .lte("started_at", todayISO() + "T23:59:59");

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.task_id) {
      map[row.task_id] = (map[row.task_id] ?? 0) + (row.minutes ?? 0);
    }
  }
  return map;
}

/** Inicia sesión para una tarea (o sin tarea con null). */
export async function startSession(
  taskIdOrNull: string | null,
  teamId: string,
  userId: string
): Promise<TimeSession | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_sessions")
    .insert({ task_id: taskIdOrNull, team_id: teamId, user_id: userId })
    .select("*")
    .single();
  return data ?? null;
}

/** Estadísticas del cronómetro de trabajo del día. */
export async function getTodayWorkStats(
  userId: string,
  teamId: string
): Promise<{ closedMinutes: number; blocks: number; activeSession: TimeSession | null }> {
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: closed }, activeSession] = await Promise.all([
    supabase
      .from("time_sessions")
      .select("minutes")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .not("ended_at", "is", null)
      .gte("started_at", today + "T00:00:00")
      .lte("started_at", today + "T23:59:59"),
    getActiveSession(userId),
  ]);

  const closedMinutes = (closed ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
  const blocks = (closed ?? []).length;
  return { closedMinutes, blocks, activeSession };
}

/** Cierra sesión: calcula minutos y guarda ended_at. */
export async function stopSession(sessionId: string): Promise<number> {
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("time_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();

  if (!session) return 0;

  const minutes = Math.max(
    1,
    Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000)
  );

  await supabase
    .from("time_sessions")
    .update({ ended_at: new Date().toISOString(), minutes })
    .eq("id", sessionId);

  return minutes;
}
