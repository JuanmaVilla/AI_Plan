import { getMyTeam } from "@/lib/queries/teams";
import { getTodayTasks } from "@/lib/queries/tasks";
import { humanDay, todayISO } from "@/lib/dates";
import { QuickAddTask } from "@/components/tasks/QuickAddTask";
import { TaskCard } from "@/components/tasks/TaskCard";

export default async function HoyPage() {
  const team = await getMyTeam();
  const tasks = team ? await getTodayTasks(team.team_id) : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
          Hoy · {humanDay(todayISO())}
        </span>
        <h1 className="font-display text-3xl font-bold text-fg" style={{ lineHeight: 1.1 }}>
          Lo de hoy
        </h1>
      </header>

      <QuickAddTask />

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] px-6 py-12 text-center">
      <span className="text-3xl">🌤️</span>
      <p className="font-body text-base text-fg-secondary">Hoy está despejado.</p>
      <p className="font-body text-sm text-fg-muted">
        Agregá una tarea arriba y empezá tranqui.
      </p>
    </div>
  );
}
