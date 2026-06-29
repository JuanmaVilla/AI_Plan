import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserHasTeam } from "@/lib/queries/teams";
import { LogoutButton } from "@/components/layout/LogoutButton";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Garantiza que el usuario tenga equipo (lo crea la primera vez).
  await ensureUserHasTeam();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_color")
    .eq("id", user.id)
    .maybeSingle();

  const name = profile?.full_name || user.email?.split("@")[0] || "yo";

  return (
    <div className="flex min-h-screen flex-col bg-base">
      <header className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
        <span className="text-gradient font-display text-lg font-bold">Hay Equipo</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 font-body text-sm text-fg-secondary">
            <span
              className="inline-block h-6 w-6 rounded-full"
              style={{ backgroundColor: profile?.avatar_color || "#0cc0df" }}
            />
            {name}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
