export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-base px-6 text-center">
      <p className="font-primary text-sm uppercase tracking-[0.12em] text-fg-muted">
        Fase 0 · Cimientos
      </p>
      <h1
        className="text-gradient font-display text-5xl font-black tracking-tight sm:text-6xl"
        style={{ lineHeight: 1.1 }}
      >
        Hay Equipo
      </h1>
      <p className="max-w-md font-body text-base text-fg-secondary">
        Organizador de tareas para equipos chicos, diseñado contra la saturación.
      </p>
      <span className="rounded-full border border-[var(--border-active)] bg-[var(--glass-bg)] px-4 py-2 font-body text-sm text-accent-cyan shadow-[var(--shadow-glow-sm)]">
        Marca lista — Unbounded + charcoal #242424
      </span>
    </main>
  );
}
