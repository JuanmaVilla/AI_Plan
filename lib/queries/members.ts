import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/types";

export type Member = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "avatar_color" | "avatar_url"
> & {
  role: string;
};

export type PendingInvite = Pick<Tables<"invites">, "id" | "email" | "role" | "created_at">;

/** Invitaciones pendientes del equipo (solo admin las ve, por RLS). */
export const getPendingInvites = cache(async (teamId: string): Promise<PendingInvite[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invites")
    .select("id, email, role, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  return (data ?? []) as PendingInvite[];
});

/** Miembros del equipo (perfil + rol), para asignar responsables. Cacheado por request. */
export const getTeamMembers = cache(async (teamId: string): Promise<Member[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_members")
    .select("role, profile:profiles!team_members_user_id_fkey(id, full_name, avatar_color, avatar_url)")
    .eq("team_id", teamId);

  return (
    (data ?? [])
      .map((row) => {
        const p = row.profile as unknown as Pick<
          Tables<"profiles">,
          "id" | "full_name" | "avatar_color" | "avatar_url"
        > | null;
        if (!p) return null;
        return { ...p, role: row.role };
      })
      .filter((m): m is Member => m !== null)
  );
});
