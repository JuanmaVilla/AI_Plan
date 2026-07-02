import { getMyTeam } from "@/lib/queries/teams";
import { isAdmin } from "@/lib/roles";
import { getProjectsWithStats } from "@/lib/queries/projects";
import { getMetas } from "@/lib/queries/metas";
import { ProjectsWorkspace } from "@/components/projects/ProjectsWorkspace";

export async function ProjectsScreen() {
  const team = await getMyTeam();
  if (!team) return null;

  const [projects, metas] = await Promise.all([
    getProjectsWithStats(team.team_id),
    getMetas(team.team_id),
  ]);

  return (
    <ProjectsWorkspace
      projects={projects}
      metas={metas.map((m) => ({ id: m.id, name: m.name, icon: m.icon }))}
      canManage={isAdmin(team.role)}
    />
  );
}
