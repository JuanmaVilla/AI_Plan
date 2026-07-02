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
): Promise<{
  closedMinutes: number;
  blocks: number;
  activeSession: TimeSession | null;
  activeTaskTitle: string | null;
}> {
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

  // Si el reloj está "pegado" a una tarea, traer su título para mostrarlo.
  let activeTaskTitle: string | null = null;
  if (activeSession?.task_id) {
    const { data: task } = await supabase
      .from("tasks")
      .select("title")
      .eq("id", activeSession.task_id)
      .maybeSingle();
    activeTaskTitle = task?.title ?? null;
  }

  const closedMinutes = (closed ?? []).reduce((s, r) => s + (r.minutes ?? 0), 0);
  const blocks = (closed ?? []).length;
  return { closedMinutes, blocks, activeSession, activeTaskTitle };
}

/** Total histórico de minutos por tarea (todas las sesiones cerradas, todo el equipo). */
export async function getTasksTotalMinutes(
  teamId: string,
  taskIds: string[]
): Promise<Record<string, number>> {
  if (taskIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_sessions")
    .select("task_id, minutes")
    .eq("team_id", teamId)
    .in("task_id", taskIds)
    .not("ended_at", "is", null);

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.task_id) {
      map[row.task_id] = (map[row.task_id] ?? 0) + (row.minutes ?? 0);
    }
  }
  return map;
}

/** Minutos trabajados por persona y por día, en un rango 'yyyy-MM-dd'. */
export async function getDailyWorkByMember(
  teamId: string,
  start: string,
  end: string
): Promise<Record<string, Record<string, number>>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_sessions")
    .select("user_id, started_at, minutes")
    .eq("team_id", teamId)
    .not("ended_at", "is", null)
    .gte("started_at", start + "T00:00:00")
    .lte("started_at", end + "T23:59:59");

  // { user_id: { 'yyyy-MM-dd': minutos } }
  const map: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const day = row.started_at.slice(0, 10);
    (map[row.user_id] ??= {})[day] =
      (map[row.user_id]?.[day] ?? 0) + (row.minutes ?? 0);
  }
  return map;
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
