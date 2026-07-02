import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getMyTeam } from "@/lib/queries/teams";
import { getProjectById } from "@/lib/queries/projects";
import { getObjectivesByProject } from "@/lib/queries/objectives";
import { getMetas } from "@/lib/queries/metas";
import { isAdmin } from "@/lib/roles";
import { ObjectivesPanel } from "@/components/objectives/ObjectivesPanel";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getMyTeam();
  if (!team) redirect("/proyectos");

  const project = await getProjectById(id);
  if (!project || project.team_id !== team.team_id) redirect("/proyectos");

  const [objectives, metas] = await Promise.all([
    getObjectivesByProject(team.team_id, id),
    getMetas(team.team_id),
  ]);
  const meta = metas.find((m) => m.id === project.company_objective_id) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <Link
          href="/proyectos"
          className="flex w-fit items-center gap-1 font-body text-sm text-fg-muted transition-colors hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" /> Proyectos
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{project.icon}</span>
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            {project.name}
          </h1>
        </div>
        {meta && (
          <span className="font-body text-sm text-fg-muted">
            Aporta a la meta {meta.icon} <strong className="text-fg-secondary">{meta.name}</strong>
          </span>
        )}
        <p className="font-body text-sm text-fg-muted">
          Definí los objetivos (con su KPI) y sumá las tareas que llevan a cada uno.
        </p>
      </div>

      <ObjectivesPanel
        projectId={project.id}
        objectives={objectives}
        canManage={isAdmin(team.role)}
      />
    </div>
  );
}
