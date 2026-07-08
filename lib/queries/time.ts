import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";
import { getServerToday, getUserTimezone } from "@/lib/queries/today";
import { zonedDayStartUtc, zonedNextDayStartUtc, isoDateInTimeZone } from "@/lib/dates";

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
  const [today, tz] = await Promise.all([getServerToday(), getUserTimezone()]);
  // Cotas como instantes UTC de la medianoche local del usuario (evita el
  // corrimiento de zona horaria al comparar contra started_at timestamptz).
  const { data } = await supabase
    .from("time_sessions")
    .select("task_id, minutes")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .not("ended_at", "is", null)
    .gte("started_at", zonedDayStartUtc(today, tz))
    .lt("started_at", zonedNextDayStartUtc(today, tz));

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
  const { data, error } = await supabase
    .from("time_sessions")
    .insert({ task_id: taskIdOrNull, team_id: teamId, user_id: userId })
    .select("*")
    .single();
  if (error) console.error("startSession:", error.message);
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
  const [today, tz] = await Promise.all([getServerToday(), getUserTimezone()]);

  const [{ data: closed }, activeSession] = await Promise.all([
    supabase
      .from("time_sessions")
      .select("minutes")
      .eq("user_id", userId)
      .eq("team_id", teamId)
      .not("ended_at", "is", null)
      .gte("started_at", zonedDayStartUtc(today, tz))
      .lt("started_at", zonedNextDayStartUtc(today, tz)),
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
  const tz = await getUserTimezone();
  const { data } = await supabase
    .from("time_sessions")
    .select("user_id, started_at, minutes")
    .eq("team_id", teamId)
    .not("ended_at", "is", null)
    .gte("started_at", zonedDayStartUtc(start, tz))
    .lt("started_at", zonedNextDayStartUtc(end, tz));

  // { user_id: { 'yyyy-MM-dd': minutos } }. El día se calcula en la zona del
  // usuario (no en UTC), así una sesión de las 22:00 local cuenta en su día.
  const map: Record<string, Record<string, number>> = {};
  for (const row of data ?? []) {
    const day = isoDateInTimeZone(new Date(row.started_at), tz);
    (map[row.user_id] ??= {})[day] =
      (map[row.user_id]?.[day] ?? 0) + (row.minutes ?? 0);
  }
  return map;
}

/** Cierra sesión: calcula minutos y guarda ended_at. */
export async function stopSession(sessionId: string): Promise<number> {
  const supabase = await createClient();

  // maybeSingle (no single): si la sesión no existe, devuelve null en vez de
  // lanzar. Así "cerrar una sesión inexistente" no rompe la acción con un 500.
  const { data: session } = await supabase
    .from("time_sessions")
    .select("started_at")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) return 0;

  const startedMs = new Date(session.started_at).getTime();
  // Si started_at fuera inválido, no calculamos basura: cerramos con 1 min.
  const minutes = Number.isNaN(startedMs)
    ? 1
    : Math.max(1, Math.round((Date.now() - startedMs) / 60000));

  const { error } = await supabase
    .from("time_sessions")
    .update({ ended_at: new Date().toISOString(), minutes })
    .eq("id", sessionId);
  if (error) throw error;

  return minutes;
}
