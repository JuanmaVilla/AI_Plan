import { getMyTeam } from "@/lib/queries/teams";
import { getWeekTasks, getBacklogTasks } from "@/lib/queries/tasks";
import { getTeamMembers } from "@/lib/queries/members";
import { getCurrentUser } from "@/lib/queries/auth";
import { currentWeekDays, next30Days, monthRange, todayISO } from "@/lib/dates";
import { WeekBoard } from "@/components/week/WeekBoard";

export default async function SemanaPage() {
  const [team, user] = await Promise.all([getMyTeam(), getCurrentUser()]);
  if (!team || !user) return null;

  const weekDays = currentWeekDays();
  const monthDays = next30Days();
  // Traemos las tareas de los 30 días (la semana es un subconjunto).
  const { start, end } = monthRange();

  const [rangeTasks, backlog, members] = await Promise.all([
    getWeekTasks(team.team_id, start, end),
    getBacklogTasks(team.team_id),
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
    />
  );
}
