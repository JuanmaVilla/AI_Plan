import { redirect } from "next/navigation";
import { getMyTeam, getMyTeams } from "@/lib/queries/teams";
import { getCurrentUser } from "@/lib/queries/auth";
import { getTeamMembers, getPendingInvites } from "@/lib/queries/members";
import { isAdmin } from "@/lib/roles";
import { EquipoManager } from "@/components/equipo/EquipoManager";

export default async function EquipoPage() {
  const [team, user, teams] = await Promise.all([getMyTeam(), getCurrentUser(), getMyTeams()]);
  if (!team || !user) redirect("/hoy");
  // Solo admin gestiona el equipo.
  if (!isAdmin(team.role)) redirect("/hoy");

  const [members, invites] = await Promise.all([
    getTeamMembers(team.team_id),
    getPendingInvites(team.team_id),
  ]);

  const workspaceName = teams.find((t) => t.team_id === team.team_id)?.name ?? "Espacio";

  return (
    <EquipoManager
      workspaceName={workspaceName}
      teamId={team.team_id}
      isOwner={team.role === "owner"}
      canDelete={teams.length > 1}
      currentUserId={user.id}
      members={members}
      invites={invites}
    />
  );
}
