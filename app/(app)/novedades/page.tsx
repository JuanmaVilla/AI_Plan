import { getMyTeam } from "@/lib/queries/teams";
import { getNewsEntries } from "@/lib/queries/news";
import { getProjects } from "@/lib/queries/projects";
import { humanDay, todayISO } from "@/lib/dates";
import { NewsForm } from "@/components/novedades/NewsForm";
import { NewsFeed } from "@/components/novedades/NewsFeed";
import type { PickProject } from "@/lib/actions/tasks";

export default async function NovedadesPage() {
  const team = await getMyTeam();
  if (!team) return null;

  const [entries, rawProjects] = await Promise.all([
    getNewsEntries(team.team_id),
    getProjects(team.team_id),
  ]);

  const projects: PickProject[] = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
    type: p.type,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {humanDay(todayISO())}
        </span>
        <h1
          className="font-display text-4xl font-black text-fg"
          style={{ letterSpacing: "-0.03em" }}
        >
          Novedades
        </h1>
        <p className="font-body text-sm text-fg-muted">
          Qué pasó hoy · para todos en el equipo
        </p>
      </header>

      <NewsForm projects={projects} />

      <NewsFeed entries={entries} />
    </div>
  );
}
