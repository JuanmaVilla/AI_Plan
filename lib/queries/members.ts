import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type Member = Pick<Tables<"profiles">, "id" | "full_name" | "avatar_color"> & {
  role: string;
};

/** Miembros del equipo (perfil + rol), para asignar responsables. */
export async function getTeamMembers(teamId: string): Promise<Member[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("role, profile:profiles!team_members_user_id_fkey(id, full_name, avatar_color)")
    .eq("team_id", teamId);

  return (
    (data ?? [])
      .map((row) => {
        const p = row.profile as unknown as Pick<
          Tables<"profiles">,
          "id" | "full_name" | "avatar_color"
        > | null;
        if (!p) return null;
        return { ...p, role: row.role };
      })
      .filter((m): m is Member => m !== null)
  );
}
