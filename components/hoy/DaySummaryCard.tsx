import type { TaskWithMeta } from "@/lib/queries/tasks";

export function DaySummaryCard({
  tasks,
  workedMinutes,
}: {
  tasks: TaskWithMeta[];
  workedMinutes: number;
}) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  function fmtWork(min: number) {
    if (min === 0) return null;
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  const worked = fmtWork(workedMinutes);

  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="glass-card flex flex-col gap-4 rounded-[20px] p-4">
      <span className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
        Resumen del día
      </span>

      <div className="flex items-center gap-4">
        {/* Círculo de progreso */}
        <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0 -rotate-90">
          <circle
            cx="26"
            cy="26"
            r="20"
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="4"
          />
          <circle
            cx="26"
            cy="26"
            r="20"
            fill="none"
            stroke="url(#prog-grad)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
          <defs>
            <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0057ff" />
              <stop offset="100%" stopColor="#00d8ff" />
            </linearGradient>
          </defs>
        </svg>
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-2xl font-bold text-fg" style={{ letterSpacing: "-0.02em" }}>
            {done}/{total}
          </span>
          <span className="font-body text-xs text-fg-muted">
            {total === 0
              ? "Sin tareas hoy"
              : done === total
              ? "¡Todo listo!"
              : `${total - done} pendiente${total - done !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      <div className="h-px bg-[var(--border-default)]" />

      <div className="flex items-center justify-between">
        <span className="font-body text-xs text-fg-muted">Avance</span>
        <span className="font-body text-sm font-semibold text-accent-cyan">{pct}%</span>
      </div>

      {worked && (
        <div className="flex items-center justify-between">
          <span className="font-body text-xs text-fg-muted">Tiempo trabajado</span>
          <span className="font-body text-sm font-semibold text-accent-mint">{worked}</span>
        </div>
      )}
    </div>
  );
}
