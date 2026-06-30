"use client";

import { useState, useEffect, useTransition } from "react";
import { Play, Square } from "lucide-react";
import type { TimeSession } from "@/lib/queries/time";
import { startTimerAction, stopTimerAction } from "@/lib/actions/time";

function fmtDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function fmtMinutes(min: number) {
  if (min === 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function Timer({
  taskId,
  activeSession,
  todayMinutes,
}: {
  taskId: string;
  activeSession: TimeSession | null;
  todayMinutes: number;
}) {
  const isMyTimer = activeSession?.task_id === taskId;
  const anotherRunning = !!activeSession && !isMyTimer;

  // Estado local para sesión activa (se actualiza al start/stop sin esperar revalidación)
  const [session, setSession] = useState<TimeSession | null>(
    isMyTimer ? activeSession : null
  );
  const [elapsed, setElapsed] = useState(0); // segundos desde started_at
  const [loggedMin, setLoggedMin] = useState(todayMinutes);
  const [pending, startTransition] = useTransition();

  // Iniciar contador si hay sesión corriendo
  useEffect(() => {
    if (!session) { setElapsed(0); return; }
    const base = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    setElapsed(base);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  function start() {
    startTransition(async () => {
      const res = await startTimerAction(taskId);
      if (res.ok) {
        setSession({ id: res.sessionId, task_id: taskId, started_at: new Date().toISOString(), ended_at: null, minutes: null, team_id: "", user_id: "" });
      }
    });
  }

  function stop() {
    if (!session) return;
    const sid = session.id;
    setSession(null);
    startTransition(async () => {
      const res = await stopTimerAction(sid);
      if (res.ok) setLoggedMin((m) => m + res.minutes);
    });
  }

  const logged = fmtMinutes(loggedMin);

  return (
    <div className="flex items-center gap-2">
      {session ? (
        <>
          <span className="flex items-center gap-1 font-body text-sm tabular-nums text-accent-mint">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-mint" />
            {fmtDuration(elapsed)}
          </span>
          <button
            type="button"
            onClick={stop}
            disabled={pending}
            aria-label="Parar cronómetro"
            className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] px-2 py-1 font-body text-xs text-fg-muted transition-colors hover:border-[var(--color-error)] hover:text-[var(--color-error)] disabled:opacity-50"
          >
            <Square className="h-3 w-3 fill-current" />
            Parar
          </button>
        </>
      ) : (
        <>
          {logged && (
            <span className="font-body text-xs text-fg-muted">{logged} hoy</span>
          )}
          <button
            type="button"
            onClick={start}
            disabled={pending || anotherRunning}
            title={anotherRunning ? "Hay otro cronómetro activo" : "Iniciar cronómetro"}
            aria-label="Iniciar cronómetro"
            className="flex items-center gap-1 rounded-lg border border-[var(--border-default)] px-2 py-1 font-body text-xs text-fg-muted transition-colors hover:border-accent-cyan hover:text-accent-cyan disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="h-3 w-3 fill-current" />
            {anotherRunning ? "Otro activo" : "Iniciar"}
          </button>
        </>
      )}
    </div>
  );
}
