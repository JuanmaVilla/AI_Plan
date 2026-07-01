import type { ProjectWithStats } from "@/lib/queries/projects";

/** Frente compacto y estático de un proyecto no seleccionado en Orbit Mode. */
export function OrbitMini({ project }: { project: ProjectWithStats }) {
  const proj = project.color || "#5b8def";
  return (
    <div
      className="glass-card proj-glow flex h-[252px] flex-col items-center justify-center gap-4 rounded-[26px] p-6 text-center"
      style={{ ["--proj" as string]: proj }}
    >
      <span className="text-4xl">{project.icon}</span>
      <div className="flex flex-col gap-1">
        <span className="font-primary text-lg font-bold text-fg">{project.name}</span>
        {project.kpi && <span className="font-body text-xs text-fg-muted">KPIs: {project.kpi}</span>}
      </div>
      <div className="flex w-32 flex-col gap-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full"
            style={{
              width: `${project.progress}%`,
              background: `linear-gradient(90deg, color-mix(in srgb, ${proj} 60%, #ffffff), ${proj})`,
            }}
          />
        </div>
        <span className="font-body text-[11px] tabular-nums" style={{ color: proj }}>
          {project.progress}%
        </span>
      </div>
    </div>
  );
}
