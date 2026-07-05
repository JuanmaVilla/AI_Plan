import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/auth";
import { ProfileSettings } from "@/components/perfil/ProfileSettings";

export default async function PerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          Perfil
        </span>
        <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
          Tu perfil
        </h1>
        <p className="font-body text-sm text-fg-muted">
          Elegí cómo te ven los demás: tu nombre, tu color y tu foto.
        </p>
      </div>

      <ProfileSettings
        fullName={profile.full_name}
        avatarColor={profile.avatar_color}
        avatarUrl={profile.avatar_url}
      />
    </div>
  );
}
