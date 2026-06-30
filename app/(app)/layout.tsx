import { redirect } from "next/navigation";
import { ensureUserHasTeam } from "@/lib/queries/teams";
import { getCurrentUser, getCurrentProfile } from "@/lib/queries/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Garantiza que el usuario tenga equipo (lo crea la primera vez).
  await ensureUserHasTeam();

  const profile = await getCurrentProfile();
  const name = profile?.full_name || user.email?.split("@")[0] || "yo";
  const avatarColor = profile?.avatar_color || "#0cc0df";

  return (
    <div className="flex min-h-screen flex-col bg-base md:flex-row">
      <Sidebar name={name} avatarColor={avatarColor} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
