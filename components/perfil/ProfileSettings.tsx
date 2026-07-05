"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { updateProfileAction, uploadAvatarAction } from "@/lib/actions/profile";
import { PROJECT_COLORS } from "@/lib/projectColors";

/** Colores para el avatar (la misma paleta luminosa de los proyectos). */
const AVATAR_COLORS = ["#0cc0df", ...PROJECT_COLORS] as const;

export function ProfileSettings({
  fullName,
  avatarColor,
  avatarUrl,
}: {
  fullName: string;
  avatarColor: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(fullName);
  const [color, setColor] = useState(avatarColor);
  const [url, setUrl] = useState(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFilePicked(file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploading(true);
    // Subida por server action (autenticada por cookies → pasa la RLS del bucket).
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadAvatarAction(fd);
    setUploading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setUrl(res.url);
    router.refresh();
  }

  function removePhoto() {
    setError(null);
    setUrl(null);
    startTransition(async () => {
      const res = await updateProfileAction({ avatarUrl: null });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateProfileAction({ fullName: name, avatarColor: color });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-3xl border border-[var(--border-default)] bg-white/[0.02] p-6">
      {/* Foto */}
      <div className="flex items-center gap-5">
        <Avatar name={name || fullName} color={color} url={url} size="xl" className="h-20 w-20 text-2xl" />
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || pending}
            >
              <Camera className="h-4 w-4" />
              {uploading ? "Subiendo…" : url ? "Cambiar foto" : "Subir foto"}
            </Button>
            {url && (
              <Button variant="ghost" size="sm" onClick={removePhoto} disabled={uploading || pending}>
                <Trash2 className="h-4 w-4" />
                Quitar foto
              </Button>
            )}
          </div>
          <span className="font-body text-xs text-fg-muted">
            JPG o PNG, hasta 4 MB. Si no subís foto, se usa tu inicial con el color que elijas.
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFilePicked(e.target.files?.[0])}
        />
      </div>

      {/* Nombre */}
      <label className="flex flex-col gap-1">
        <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
          Tu nombre
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none focus:border-[var(--border-active)]"
        />
      </label>

      {/* Color */}
      <div className="flex flex-col gap-2">
        <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
          Color de tu avatar
        </span>
        <div className="flex flex-wrap gap-2.5">
          {AVATAR_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition-transform ${
                color === c ? "scale-110 ring-2 ring-[var(--border-active)] ring-offset-2 ring-offset-[var(--surface,transparent)]" : "hover:scale-105"
              }`}
              style={{ background: c }}
            >
              {color === c && <Check className="h-4 w-4 text-white" />}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={pending || uploading}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {saved && !pending && (
          <span className="font-body text-sm text-[var(--color-success)]">Guardado ✓</span>
        )}
      </div>
    </div>
  );
}
