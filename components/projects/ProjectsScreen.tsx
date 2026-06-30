import { getMyTeam } from "@/lib/queries/teams";
import { getProjectsWithStats, type ProjectType } from "@/lib/queries/projects";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";

const COPY: Record<ProjectType, { kicker: string; title: string; empty: string }> = {
  proyecto: {
    kicker: "Proyectos",
    title: "Tus proyectos",
    empty: "Todavía no hay proyectos. Creá el primero.",
  },
  objetivo: {
    kicker: "Objetivos",
    title: "Tus objetivos",
    empty: "Todavía no hay objetivos. Definí el primero.",
  },
};

export async function ProjectsScreen({ type }: { type: ProjectType }) {
  const team = await getMyTeam();
  const projects = team ? await getProjectsWithStats(team.team_id, type) : [];
  const copy = COPY[type];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-sm font-semibold tracking-[0.06em] text-accent-cyan">
            {copy.kicker}
          </span>
          <h1 className="display-heading text-5xl text-fg">{copy.title}</h1>
        </div>
        <NewProjectDialog type={type} />
      </header>

      {projects.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] px-6 py-12 text-center font-body text-fg-muted">
          {copy.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects
            .filter((p) => !(type === "proyecto" && p.name === "General" && p.taskCount === 0))
            .map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
        </div>
      )}
    </div>
  );
}
