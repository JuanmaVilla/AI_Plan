"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/auth";
import type { TablesUpdate } from "@/lib/types";

/** Actualiza el perfil propio: color del avatar, foto (URL pública), nombre y/o zona. */
export async function updateProfileAction(patch: {
  avatarColor?: string;
  avatarUrl?: string | null;
  fullName?: string;
  timezone?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { ok: false as const, error: "No hay sesión." };

  const update: TablesUpdate<"profiles"> = {};
  if (patch.avatarColor !== undefined) update.avatar_color = patch.avatarColor;
  if (patch.avatarUrl !== undefined) update.avatar_url = patch.avatarUrl;
  if (patch.timezone !== undefined) update.timezone = patch.timezone;
  if (patch.fullName !== undefined) {
    const name = patch.fullName.trim();
    if (!name) return { ok: false as const, error: "El nombre no puede quedar vacío." };
    update.full_name = name;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { ok: false as const, error: "No se pudo guardar." };

  revalidatePath("/", "layout");
  return { ok: true as const };
}

/**
 * Sube la foto de perfil DESDE EL SERVIDOR y guarda la URL en el perfil.
 * Se hace server-side (no en el navegador) porque el cliente del navegador no
 * adjustaba el token al request de Storage → la RLS del bucket (auth.uid() =
 * carpeta) rechazaba la subida. El cliente de servidor sí está autenticado por
 * cookies, así que auth.uid() coincide con la carpeta {uid}/.
 */
export async function uploadAvatarAction(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "No hay sesión." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió la foto." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "La foto es muy pesada (máximo 5 MB)." };
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${user.id}/avatar.${ext}`;

  const supabase = await createClient();

  // El storage-js del cliente de servidor de @supabase/ssr no adjunta el token
  // del usuario → la RLS del bucket ve auth.uid() = null → 400. Subimos con fetch
  // explícito al endpoint de Storage forzando el Bearer del usuario.
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return { ok: false, error: "No hay sesión activa. Volvé a entrar." };

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const uploadRes = await fetch(`${base}/storage/v1/object/avatars/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
      "Content-Type": file.type || "image/jpeg",
      "x-upsert": "true",
      "cache-control": "3600",
    },
    body: Buffer.from(await file.arrayBuffer()),
  });
  if (!uploadRes.ok) {
    return { ok: false, error: "No se pudo subir la foto. Probá de nuevo." };
  }

  const url = `${base}/storage/v1/object/public/avatars/${path}?v=${Date.now()}`;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", user.id);
  if (dbErr) return { ok: false, error: "Se subió la foto pero no se guardó. Probá de nuevo." };

  revalidatePath("/", "layout");
  return { ok: true, url };
}
