import { getMyTeam } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getViewScope } from "@/lib/queries/scope";
import { isAdmin } from "@/lib/roles";
import { getNewsEntries } from "@/lib/queries/news";
import { getProjects } from "@/lib/queries/projects";
import { getTodayWorkStats } from "@/lib/queries/time";
import { humanDay, todayISO } from "@/lib/dates";
import { WorkTimer } from "@/components/hoy/WorkTimer";
import { NewsForm, type NewsProject } from "@/components/novedades/NewsForm";
import { NewsFeed } from "@/components/novedades/NewsFeed";

export default async function NovedadesPage() {
  const [team, user, scope] = await Promise.all([getMyTeam(), getCurrentUser(), getViewScope()]);
  if (!team) return null;

  // Novedades, proyectos y estadísticas del cronómetro en paralelo.
  const [entries, rawProjects, workStats] = await Promise.all([
    getNewsEntries(team.team_id, scope === "mine" && user ? user.id : undefined),
    getProjects(team.team_id),
    user
      ? getTodayWorkStats(user.id, team.team_id)
      : Promise.resolve({ closedMinutes: 0, blocks: 0, activeSession: null }),
  ]);

  const projects: NewsProject[] = rawProjects.map((p) => ({
    id: p.id,
    name: p.name,
    icon: p.icon,
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <WorkTimer
        closedMinutes={workStats.closedMinutes}
        blocks={workStats.blocks}
        activeSession={workStats.activeSession}
      />

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

      <NewsFeed
        entries={entries}
        currentUserId={user?.id ?? ""}
        canModerate={isAdmin(team.role)}
      />
    </div>
  );
}
