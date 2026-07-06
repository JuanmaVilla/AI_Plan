import { getMyTeam, getMyTeams } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getTodayTasksView } from "@/lib/queries/tasks";
import { getProjects } from "@/lib/queries/projects";
import { getTodayWorkStats, getTasksTotalMinutes } from "@/lib/queries/time";
import { getHsView, getHsSpaces, resolveHsView } from "@/lib/queries/hsView";
import { getServerToday } from "@/lib/queries/today";
import { humanDay } from "@/lib/dates";
import { NewTaskButton } from "@/components/tasks/NewTaskButton";
import { HsViewSelector } from "@/components/layout/HsViewSelector";
import { WorkTimer } from "@/components/hoy/WorkTimer";
import { TaskBentoCard } from "@/components/hoy/TaskBentoCard";
import { DaySummaryCard } from "@/components/hoy/DaySummaryCard";
import { OnboardingSteps } from "@/components/hoy/OnboardingSteps";

export default async function HoyPage() {
  const [team, user, teams, hsView, hsSpaces] = await Promise.all([
    getMyTeam(),
    getCurrentUser(),
    getMyTeams(),
    getHsView(),
    getHsSpaces(),
  ]);
  if (!team || !user) return null;

  // Resolver la vista → espacios a consultar + filtro "mío".
  const { teamIds, mineUid, multiSpace } = resolveHsView(
    hsView,
    team.team_id,
    teams.map((t) => t.team_id),
    hsSpaces,
    user.id
  );
  const teamNames = Object.fromEntries(teams.map((t) => [t.team_id, t.name]));
  const today = await getServerToday();

  // Tareas de hoy (según la vista), cronómetro y proyectos en paralelo.
  const [tasks, workStats, projects] = await Promise.all([
    getTodayTasksView(teamIds, mineUid, today),
    getTodayWorkStats(user.id, team.team_id),
    getProjects(team.team_id),
  ]);
  const hasProjects = projects.length > 0;

  // Total histórico de minutos por tarea (del espacio activo; en otros espacios = 0).
  const taskTotals =
    tasks.length > 0
      ? await getTasksTotalMinutes(team.team_id, tasks.map((t) => t.id))
      : {};

  const doneTasks = tasks.filter((t) => t.done).length;

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      {/* ── Onboarding suave: guía a planear antes de ejecutar ── */}
      {!hasProjects && <OnboardingSteps />}

      {/* ── Cronómetro de trabajo ── */}
      <WorkTimer
        closedMinutes={workStats.closedMinutes}
        blocks={workStats.blocks}
        activeSession={workStats.activeSession}
        activeTaskTitle={workStats.activeTaskTitle}
      />

      {/* ── Header ── */}
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {humanDay(today)}
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
            <HsViewSelector view={hsView} workspaces={teams} selectedSpaces={hsSpaces} />
            <span data-tour="hoy-new-task" className="inline-flex">
              <NewTaskButton defaultDay="hoy" label="+ Tarea" />
            </span>
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
        /* ── Resumen como columna angosta y alta a la izquierda; tareas en grid ── */
        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Resumen: delgado + alto (ocupa toda la altura de la grilla) */}
          <div className="lg:w-56 lg:shrink-0">
            <DaySummaryCard
              tasks={tasks}
              workedMinutes={workStats.closedMinutes}
            />
          </div>

          <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tasks.map((task) => (
              <TaskBentoCard
                key={task.id}
                task={task}
                activeSession={workStats.activeSession}
                totalMinutes={taskTotals[task.id] ?? 0}
                workspaceName={multiSpace ? teamNames[task.team_id] : undefined}
              />
            ))}

            {/* Card agregar tarea, translúcida y sutil */}
            <AddTaskCard />
          </div>
        </div>
      )}
    </div>
  );
}

function AddTaskCard() {
  return (
    <NewTaskButton
      defaultDay="hoy"
      label="Agregar tarea"
      variant="ghost"
      showIcon={false}
      className="card-ghost group flex h-auto min-h-[140px] w-full flex-col items-center justify-center gap-2.5 rounded-[26px] p-6 text-center font-body text-xs font-medium text-fg-muted hover:bg-transparent hover:text-fg"
      iconBefore={
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 font-display text-xl text-fg-muted transition-colors group-hover:text-fg">
          +
        </span>
      }
    />
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
        Sumá tareas desde tus objetivos (en <strong>Proyectos</strong>) y agendalas para hoy.
      </p>
      <div className="mt-2">
        <NewTaskButton defaultDay="hoy" label="+ Agregar tarea de hoy" variant="outline" />
      </div>
    </div>
  );
}
