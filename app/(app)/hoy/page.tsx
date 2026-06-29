import { getMyTeam } from "@/lib/queries/teams";

export default async function HoyPage() {
  const team = await getMyTeam();

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <p className="font-primary text-sm uppercase tracking-[0.12em] text-fg-muted">
        Fase 1 · Datos y usuarios
      </p>
      <h1 className="font-display text-4xl font-bold text-fg" style={{ lineHeight: 1.1 }}>
        Hola, ya estás dentro
      </h1>
      <p className="max-w-md font-body text-base text-fg-secondary">
        Tu cuenta existe y tenés un equipo creado. En la Fase 2 esta pantalla
        mostrará las tareas de hoy.
      </p>
      <span className="rounded-full border border-[var(--border-active)] bg-[var(--glass-bg)] px-4 py-2 font-body text-sm text-accent-cyan">
        team_id: {team?.team_id ?? "—"} · rol: {team?.role ?? "—"}
      </span>
    </div>
  );
}
