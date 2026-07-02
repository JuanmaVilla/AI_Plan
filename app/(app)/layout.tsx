import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasTeam, getMyTeam, getMyTeams } from "@/lib/queries/teams";
import { getCurrentUser, getCurrentProfile } from "@/lib/queries/auth";
import { getViewScope } from "@/lib/queries/scope";
import { Sidebar } from "@/components/layout/Sidebar";
import { RealtimeRefresher } from "@/components/layout/RealtimeRefresher";
import { OnboardingLauncher } from "@/components/onboarding/OnboardingLauncher";
import { CommandPalette } from "@/components/search/CommandPalette";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Reclama invitaciones pendientes (por email) ANTES de leer los espacios,
  // así el usuario entra ya dentro de los espacios a los que lo invitaron.
  const supabase = await createClient();
  await supabase.rpc("claim_pending_invites");

  // Garantiza que el usuario tenga al menos un espacio propio.
  await ensureUserHasTeam();

  const [teams, active, profile, viewScope] = await Promise.all([
    getMyTeams(),
    getMyTeam(),
    getCurrentProfile(),
    getViewScope(),
  ]);
  const name = profile?.full_name || user.email?.split("@")[0] || "yo";
  const avatarColor = profile?.avatar_color || "#0cc0df";

  return (
    <div className="flex min-h-screen flex-col bg-base md:h-screen md:flex-row md:overflow-hidden">
      <Sidebar
        name={name}
        avatarColor={avatarColor}
        teams={teams}
        activeTeamId={active?.team_id ?? null}
        role={active?.role ?? "member"}
        viewScope={viewScope}
      />
      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">{children}</main>
      {active && <RealtimeRefresher teamId={active.team_id} />}
      <OnboardingLauncher />
      <CommandPalette />
    </div>
  );
}
