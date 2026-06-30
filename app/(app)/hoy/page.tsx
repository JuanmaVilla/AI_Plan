import Link from "next/link";
import { getMyTeam } from "@/lib/queries/teams";
import { getTodayTasks } from "@/lib/queries/tasks";
import { humanDay, todayISO } from "@/lib/dates";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { TaskCard } from "@/components/tasks/TaskCard";

export default async function HoyPage() {
  const team = await getMyTeam();
  const tasks = team ? await getTodayTasks(team.team_id) : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-sm font-semibold tracking-[0.06em] text-accent-cyan">
            Hoy · {humanDay(todayISO())}
          </span>
          <h1 className="display-heading text-5xl text-fg">Lo de hoy</h1>
        </div>
        <NewTaskButton defaultDay="hoy" />
      </header>

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
      <p className="font-body text-base text-fg-secondary">Hoy no tenés nada agendado.</p>
      <p className="font-body text-sm text-fg-muted">
        Tocá “Nueva tarea” y elegí <strong>Hoy</strong>, o agendá desde{" "}
        <Link href="/semana" className="text-accent-cyan underline">
          Semana
        </Link>
        .
      </p>
    </div>
  );
}
