import { getMyTeam } from "@/lib/queries/teams";
import { getMetasWithProjects } from "@/lib/queries/metas";
import { getProjects } from "@/lib/queries/projects";
import { isAdmin } from "@/lib/roles";
import { MetasScreen } from "@/components/metas/MetasScreen";

export default async function MetasPage() {
  const team = await getMyTeam();
  if (!team) return null;

  const [metas, projects] = await Promise.all([
    getMetasWithProjects(team.team_id),
    getProjects(team.team_id),
  ]);

  return (
    <MetasScreen
      metas={metas}
      allProjects={projects.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        company_objective_id: p.company_objective_id,
      }))}
      canManage={isAdmin(team.role)}
    />
  );
}
