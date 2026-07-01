import { redirect } from "next/navigation";
import { ensureUserHasTeam } from "@/lib/queries/teams";
import { getCurrentUser, getCurrentProfile } from "@/lib/queries/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { RealtimeRefresher } from "@/components/layout/RealtimeRefresher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const team = await ensureUserHasTeam();

  const profile = await getCurrentProfile();
  const name = profile?.full_name || user.email?.split("@")[0] || "yo";
  const avatarColor = profile?.avatar_color || "#0cc0df";

  return (
    <div className="flex min-h-screen flex-col bg-base md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar name={name} avatarColor={avatarColor} />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">{children}</main>
      {team && <RealtimeRefresher teamId={team.team_id} />}
    </div>
  );
}
