import { getMyTeam } from "@/lib/queries/teams";
import { getBacklogTasks } from "@/lib/queries/tasks";
import { getCurrentUser } from "@/lib/queries/auth";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { BacklogList } from "@/components/backlog/BacklogList";

export default async function BacklogPage() {
  const [team, user] = await Promise.all([getMyTeam(), getCurrentUser()]);
  if (!team || !user) return null;

  const tasks = await getBacklogTasks(team.team_id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-sm font-semibold tracking-[0.06em] text-accent-cyan">
            Backlog
          </span>
          <h1 className="display-heading text-5xl text-fg">Sin agendar</h1>
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
