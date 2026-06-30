import type { TaskWithMeta } from "@/lib/queries/tasks";

export function DaySummaryCard({
  tasks,
  workedMinutes,
  className = "",
}: {
  tasks: TaskWithMeta[];
  workedMinutes: number;
  className?: string;
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

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className={`card-soft celeste flex h-full min-h-[300px] flex-col justify-between gap-6 rounded-[26px] p-5 ${className}`}>
      <span className="font-body text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted">
        Resumen del día
      </span>

      <div className="flex items-center gap-4">
        {/* Anillo de progreso suave */}
        <div className="relative shrink-0">
          <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
            <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <circle
              cx="30"
              cy="30"
              r="22"
              fill="none"
              stroke="url(#prog-grad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <defs>
              <linearGradient id="prog-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-accent-teal)" />
                <stop offset="100%" stopColor="var(--color-accent-mint)" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold tabular-nums text-fg">
            {pct}%
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="font-display text-3xl font-bold leading-none text-fg" style={{ letterSpacing: "-0.02em" }}>
            {done}
            <span className="text-lg text-fg-muted">/{total}</span>
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

      {worked && (
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-accent-mint">{worked}</span>
          <span className="font-body text-xs text-fg-muted">trabajado hoy</span>
        </div>
      )}
    </div>
  );
}
