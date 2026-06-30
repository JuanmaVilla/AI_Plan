import { getMyTeam } from "@/lib/queries/teams";
import { getWeekTasks, getBacklogTasks } from "@/lib/queries/tasks";
import { getTeamMembers } from "@/lib/queries/members";
import { getCurrentUser } from "@/lib/queries/auth";
import { currentWeekDays, weekRange, todayISO } from "@/lib/dates";
import { WeekBoard } from "@/components/week/WeekBoard";

export default async function SemanaPage() {
  const [team, user] = await Promise.all([getMyTeam(), getCurrentUser()]);
  if (!team || !user) return null;

  const weekDays = currentWeekDays();
  const { start, end } = weekRange();

  const [weekTasks, backlog, members] = await Promise.all([
    getWeekTasks(team.team_id, start, end),
    getBacklogTasks(team.team_id),
    getTeamMembers(team.team_id),
  ]);

  return (
    <WeekBoard
      weekDays={weekDays}
      today={todayISO()}
      initialTasks={[...weekTasks, ...backlog]}
      members={members}
      currentUserId={user.id}
    />
  );
}
