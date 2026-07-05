"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/auth";

/** Marca la guía interactiva como completada (no vuelve a salir sola). */
export async function completeOnboardingAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const };
  const supabase = await createClient();
  await supabase.from("profiles").update({ onboarding_done: true }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: true as const };
}
