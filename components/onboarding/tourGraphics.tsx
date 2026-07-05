/** Mini-gráficos visuales para la guía interactiva. */

export function SmartGraphic() {
  const items = [
    ["S", "Específica", "clara, sin vueltas"],
    ["M", "Medible", "un número que la mida"],
    ["A", "Alcanzable", "realista con tus recursos"],
    ["R", "Relevante", "que de verdad importe"],
    ["T", "con Tiempo", "una fecha límite"],
  ];
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl bg-white/[0.04] p-3">
      {items.map(([l, t, d]) => (
        <div key={l} className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/20 font-display text-sm font-black text-accent-cyan">
            {l}
          </span>
          <span className="font-body text-xs text-fg">
            <strong className="text-fg">{t}</strong>{" "}
            <span className="text-fg-muted">— {d}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function KpiMockGraphic() {
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.04] p-3">
      <span className="font-body text-xs font-semibold text-fg">🎯 Publicar 8 reels</span>
      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-black tabular-nums text-fg">3</span>
        <span className="font-body text-sm text-fg-muted">/ 8 reels</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent-mint" style={{ width: "37%" }} />
        </div>
        <span className="font-body text-[11px] font-semibold tabular-nums text-accent-mint">37%</span>
      </div>
      <span className="font-body text-[11px] text-fg-muted">
        El KPI es un número: <strong>meta</strong> + <strong>valor actual</strong>. Se ve el avance de un vistazo.
      </span>
    </div>
  );
}

export function PyramidGraphic() {
  const rows = [
    ["Meta", "🏁", "#0057FF"],
    ["Proyecto", "📌", "#4FC4E0"],
    ["Objetivo", "🎯", "#4FD1B5"],
    ["Tarea", "✅", "#7FD957"],
  ];
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.04] p-3">
      {rows.map(([label, icon, color], i) => (
        <div
          key={label}
          className="flex items-center justify-center gap-2 rounded-xl py-1.5 font-body text-xs font-semibold text-white"
          style={{ background: color as string, width: `${60 + i * 12}%` }}
        >
          <span>{icon}</span> {label}
        </div>
      ))}
      <span className="mt-1 font-body text-[11px] text-fg-muted">
        Cada tarea sube hasta una meta. Nunca trabajás en algo suelto.
      </span>
    </div>
  );
}
