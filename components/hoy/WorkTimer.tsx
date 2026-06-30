"use client";

import { useState, useEffect, useTransition } from "react";
import { Play, Pause } from "lucide-react";
import type { TimeSession } from "@/lib/queries/time";
import { startWorkTimerAction, pauseWorkTimerAction } from "@/lib/actions/time";

function fmtTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function fmtMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function WorkTimer({
  closedMinutes,
  blocks,
  activeSession: initialSession,
}: {
  closedMinutes: number;
  blocks: number;
  activeSession: TimeSession | null;
}) {
  const [session, setSession] = useState<TimeSession | null>(initialSession);
  const [elapsed, setElapsed] = useState(0);
  const [addedMinutes, setAddedMinutes] = useState(0);
  const [pending, startTransition] = useTransition();

  const isRunning = !!session;
  const totalMinutes = closedMinutes + addedMinutes;
  const totalSeconds = totalMinutes * 60 + elapsed;

  useEffect(() => {
    if (!session) { setElapsed(0); return; }
    const base = Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000);
    setElapsed(Math.max(0, base));
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [session]);

  function start() {
    startTransition(async () => {
      const res = await startWorkTimerAction();
      if (res.ok) {
        setSession({ id: res.sessionId, started_at: res.startedAt, ended_at: null, minutes: null, task_id: null, team_id: "", user_id: "" });
      }
    });
  }

  function pause() {
    if (!session) return;
    const sid = session.id;
    const secs = elapsed;
    setSession(null);
    setElapsed(0);
    startTransition(async () => {
      const res = await pauseWorkTimerAction(sid);
      if (res.ok) setAddedMinutes((m) => m + res.minutes);
    });
    // Optimistic: add elapsed locally
    setAddedMinutes((m) => m + Math.round(secs / 60));
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-surface/60 px-5 py-3 backdrop-blur-sm">
      {/* Indicador estado */}
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${isRunning ? "animate-pulse bg-accent-mint" : "bg-fg-disabled"}`}
        />
        <span className="font-body text-xs font-semibold tracking-widest text-fg-muted">
          {isRunning ? "TRABAJANDO" : totalMinutes > 0 ? "PAUSADO" : "SIN INICIAR"}
        </span>
      </div>

      {/* Tiempo total */}
      <span
        className="font-display text-2xl tabular-nums text-fg"
        style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
      >
        {fmtTime(totalSeconds)}
      </span>

      {/* Bloques */}
      {(blocks + (isRunning ? 1 : 0)) > 0 && (
        <span className="font-body text-xs text-fg-muted">
          {blocks + (isRunning ? 1 : 0)} {blocks + (isRunning ? 1 : 0) === 1 ? "bloque" : "bloques"}
        </span>
      )}

      {/* Resumen si hay tiempo cerrado */}
      {totalMinutes > 0 && (
        <span className="font-body text-xs text-fg-muted">
          {fmtMinutes(totalMinutes)} registrados
        </span>
      )}

      {/* Botón */}
      <button
        type="button"
        onClick={isRunning ? pause : start}
        disabled={pending}
        className={`ml-auto flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm font-bold transition-all disabled:opacity-50 ${
          isRunning
            ? "border border-[var(--border-default)] bg-elevated text-fg hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]"
            : "text-white shadow-[0_4px_16px_rgba(0,87,255,0.35)]"
        }`}
        style={!isRunning ? { background: "var(--brand-gradient)" } : undefined}
      >
        {isRunning ? (
          <>
            <Pause className="h-3.5 w-3.5 fill-current" />
            Pausar
          </>
        ) : (
          <>
            <Play className="h-3.5 w-3.5 fill-current" />
            {totalMinutes > 0 ? "Retomar" : "Iniciar"}
          </>
        )}
      </button>
    </div>
  );
}
