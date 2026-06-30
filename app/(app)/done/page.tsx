import { getMyTeam } from "@/lib/queries/teams";
import { getDoneTasks } from "@/lib/queries/tasks";
import { DoneList } from "@/components/tasks/DoneList";

export default async function DonePage() {
  const team = await getMyTeam();
  const tasks = team ? await getDoneTasks(team.team_id) : [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          Hecho
        </span>
        <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
          Terminadas
        </h1>
        <p className="font-body text-sm text-fg-muted">
          Todo lo que el equipo dio por terminado. Destildá una para reactivarla.
        </p>
      </header>

      <DoneList tasks={tasks} />
    </div>
  );
}
