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
  if (min <= 0) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Control de tiempo por tarea. Un solo reloj en toda la app: darle Play a una
 * tarea pausa lo que estuviera corriendo y "pega" el reloj a esta tarea.
 */
export function TaskTimeControl({
  taskId,
  activeSession,
  totalMinutes,
}: {
  taskId: string;
  activeSession: TimeSession | null;
  totalMinutes: number;
}) {
  const isMine = activeSession?.task_id === taskId;
  const anotherRunning = !!activeSession && !isMine;

  const [running, setRunning] = useState(isMine);
  const [startedAt, setStartedAt] = useState<string | null>(
    isMine ? activeSession!.started_at : null
  );
  const [elapsed, setElapsed] = useState(0);
  const [pending, startTransition] = useTransition();

  // Sincronizar con lo que trae el servidor tras revalidar.
  useEffect(() => {
    setRunning(isMine);
    setStartedAt(isMine ? activeSession!.started_at : null);
  }, [isMine, activeSession]);

  // Contador vivo.
  useEffect(() => {
    if (!running || !startedAt) {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  function start() {
    setRunning(true);
    setStartedAt(new Date().toISOString());
    startTransition(async () => {
      const res = await startTimerAction(taskId);
      if (!res.ok) {
        setRunning(false);
        setStartedAt(null);
      }
    });
  }

  function stop() {
    if (!activeSession) return;
    const sid = activeSession.id;
    setRunning(false);
    setStartedAt(null);
    startTransition(() => {
      stopTimerAction(sid);
    });
  }

  const total = fmtMinutes(totalMinutes);

  return (
    <div className="flex items-center gap-2">
      {running ? (
        <button
          type="button"
          onClick={stop}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={pending}
          aria-label="Parar cronómetro"
          className="flex items-center gap-1.5 rounded-full bg-accent-mint/15 px-2.5 py-1 font-body text-xs font-semibold tabular-nums text-accent-mint transition-colors hover:bg-accent-mint/25 disabled:opacity-50"
        >
          <Square className="h-3 w-3 fill-current" />
          {fmtDuration(elapsed)}
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          onPointerDown={(e) => e.stopPropagation()}
          disabled={pending || anotherRunning}
          title={anotherRunning ? "Hay otro cronómetro activo" : "Trabajar en esta tarea"}
          aria-label="Iniciar cronómetro en esta tarea"
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 font-body text-xs font-semibold text-fg-muted transition-colors hover:bg-white/8 hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="h-3 w-3 fill-current" />
          {total ? total : "Trabajar"}
        </button>
      )}
    </div>
  );
}
