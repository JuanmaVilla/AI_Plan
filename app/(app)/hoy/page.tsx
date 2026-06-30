import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getTodayTasks } from "@/lib/queries/tasks";
import { getTodayWorkStats } from "@/lib/queries/time";
import { humanDay, todayISO } from "@/lib/dates";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { WorkTimer } from "@/components/hoy/WorkTimer";
import { TaskBentoCard } from "@/components/hoy/TaskBentoCard";
import { DaySummaryCard } from "@/components/hoy/DaySummaryCard";

export default async function HoyPage() {
  const [team, user] = await Promise.all([getMyTeam(), getCurrentUser()]);
  const tasks = team ? await getTodayTasks(team.team_id) : [];

  const workStats =
    user && team
      ? await getTodayWorkStats(user.id, team.team_id)
      : { closedMinutes: 0, blocks: 0, activeSession: null };

  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      {/* ── Cronómetro de trabajo ── */}
      <WorkTimer
        closedMinutes={workStats.closedMinutes}
        blocks={workStats.blocks}
        activeSession={workStats.activeSession}
      />

      {/* ── Header ── */}
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {humanDay(todayISO())}
        </span>
        <div className="flex items-end justify-between gap-4">
          <h1
            className="font-display text-4xl font-black text-fg"
            style={{ letterSpacing: "-0.03em" }}
          >
            Hoy
          </h1>
          <div className="flex items-center gap-3">
            {tasks.length > 0 && (
              <span className="font-body text-sm text-fg-muted">
                {doneTasks} de {tasks.length} completadas
              </span>
            )}
            <NewTaskButton defaultDay="hoy" label="+ Tarea" />
          </div>
        </div>
        {tasks.length > 0 && (
          <p className="font-body text-sm text-fg-muted">
            Estas son tus tareas para hoy
          </p>
        )}
      </header>

      {tasks.length === 0 ? (
        <EmptyState />
      ) : (
        /* ── Bento grid ── */
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className={
                // Primera card ocupa ancho completo cuando hay 3+ tareas (efecto bento)
                tasks.length >= 3 && i === 0 ? "md:col-span-2 xl:col-span-1" : ""
              }
            >
              <TaskBentoCard task={task} />
            </div>
          ))}

          {/* Card resumen */}
          <DaySummaryCard
            tasks={tasks}
            workedMinutes={workStats.closedMinutes}
          />

          {/* Card agregar tarea sutil */}
          <AddTaskCard />
        </div>
      )}
    </div>
  );
}

function AddTaskCard() {
  return (
    <div className="flex items-center justify-center rounded-[20px] border border-dashed border-[var(--border-default)] p-6 transition-colors hover:border-[var(--border-active)]">
      <NewTaskButton
        defaultDay="hoy"
        label="+ Agregar tarea para hoy"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-[var(--border-default)] px-8 py-16 text-center">
      <span className="text-4xl">🌤️</span>
      <p className="font-body text-base font-semibold text-fg-secondary">
        Hoy no tenés nada agendado
      </p>
      <p className="font-body text-sm text-fg-muted">
        Tocá &ldquo;+ Tarea&rdquo; y elegí <strong>Hoy</strong>, o arrastrá desde el Backlog.
      </p>
      <div className="mt-2">
        <NewTaskButton defaultDay="hoy" label="+ Agregar primera tarea" />
      </div>
    </div>
  );
}
