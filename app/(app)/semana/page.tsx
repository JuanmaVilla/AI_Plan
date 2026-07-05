import { getMyTeam, getMyTeams } from "@/lib/queries/teams";
import { getWeekTasksView, getBacklogTasksView } from "@/lib/queries/tasks";
import { getTeamMembers } from "@/lib/queries/members";
import { getCurrentUser } from "@/lib/queries/auth";
import { getHsView, getHsSpaces, resolveHsView } from "@/lib/queries/hsView";
import { isAdmin } from "@/lib/roles";
import { currentWeekDays, next30Days, monthRange, todayISO } from "@/lib/dates";
import { WeekBoard } from "@/components/week/WeekBoard";

export default async function SemanaPage() {
  const [team, user, teams, hsView, hsSpaces] = await Promise.all([
    getMyTeam(),
    getCurrentUser(),
    getMyTeams(),
    getHsView(),
    getHsSpaces(),
  ]);
  if (!team || !user) return null;

  const weekDays = currentWeekDays();
  const monthDays = next30Days();
  // Traemos las tareas de los 30 días (la semana es un subconjunto).
  const { start, end } = monthRange();

  const { teamIds, mineUid, multiSpace } = resolveHsView(
    hsView,
    team.team_id,
    teams.map((t) => t.team_id),
    hsSpaces,
    user.id
  );
  const teamNames = Object.fromEntries(teams.map((t) => [t.team_id, t.name]));
  // En vista multi-espacio no se reasigna (los miembros difieren por espacio).
  const admin = isAdmin(team.role) && !multiSpace;

  const [rangeTasks, backlog, members] = await Promise.all([
    getWeekTasksView(teamIds, start, end, mineUid),
    getBacklogTasksView(teamIds, mineUid),
    getTeamMembers(team.team_id),
  ]);

  return (
    <WeekBoard
      weekDays={weekDays}
      monthDays={monthDays}
      today={todayISO()}
      initialTasks={[...rangeTasks, ...backlog]}
      members={members}
      currentUserId={user.id}
      canReassign={admin}
      hsView={hsView}
      workspaces={teams}
      selectedSpaces={hsSpaces}
      teamNames={teamNames}
      multiSpace={multiSpace}
    />
  );
}
