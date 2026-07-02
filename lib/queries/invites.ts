import { createClient } from "@/lib/supabase/server";

// Cache en memoria por instancia (no se puede setear cookie durante el render del
// layout). Evita llamar claim_pending_invites en cada navegación: 1 vez cada TTL
// por usuario y por instancia serverless. Es idempotente, así que repetir es seguro.
const lastChecked = new Map<string, number>();
const TTL_MS = 10 * 60 * 1000; // 10 min

/**
 * Reclama invitaciones pendientes del usuario, pero como mucho una vez cada
 * TTL por instancia. Ahorra un round-trip a Supabase en la mayoría de las cargas.
 */
export async function maybeClaimInvites(userId: string): Promise<void> {
  const now = Date.now();
  const prev = lastChecked.get(userId);
  if (prev && now - prev < TTL_MS) return;
  lastChecked.set(userId, now);

  const supabase = await createClient();
  await supabase.rpc("claim_pending_invites");
}
