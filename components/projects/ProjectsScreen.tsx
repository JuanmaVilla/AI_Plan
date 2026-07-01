import { getMyTeam } from "@/lib/queries/teams";
import { getProjectsWithStats, type ProjectType } from "@/lib/queries/projects";
import { ProjectsWorkspace } from "@/components/projects/ProjectsWorkspace";

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

  const visible = projects.filter(
    (p) => !(type === "proyecto" && p.name === "General" && p.taskCount === 0)
  );

  return <ProjectsWorkspace projects={visible} type={type} copy={copy} />;
}
