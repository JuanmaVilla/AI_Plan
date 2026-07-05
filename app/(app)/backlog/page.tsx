import { getMyTeam } from "@/lib/queries/teams";
import { getBacklogTasks } from "@/lib/queries/tasks";
import { getCurrentUser } from "@/lib/queries/auth";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { BacklogList } from "@/components/backlog/BacklogList";

export default async function BacklogPage() {
  const [team, user] = await Promise.all([getMyTeam(), getCurrentUser()]);
  if (!team || !user) return null;

  // Muestra todo el backlog del equipo (el filtro "solo lo mío" vive en Hoy/Semana).
  const tasks = await getBacklogTasks(team.team_id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            Backlog
          </span>
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            Sin agendar
          </h1>
          <p className="font-body text-sm text-fg-muted">
            Tareas todavía sin día. Agendalas acá o arrastrándolas en Semana.
          </p>
        </div>
        <NewTaskButton />
      </header>

      <BacklogList tasks={tasks} currentUserId={user.id} />
    </div>
  );
}
