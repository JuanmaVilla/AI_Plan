import { cn } from "@/lib/utils";

const SIZES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-7 w-7 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-9 w-9 text-sm",
  xl: "h-11 w-11 text-base",
} as const;

export type AvatarSize = keyof typeof SIZES;

/**
 * Avatar de perfil unificado: foto si hay `url`, si no inicial + color.
 * `url` guarda la URL pública completa (con cache-buster) de profiles.avatar_url.
 */
export function Avatar({
  name,
  color,
  url,
  size = "sm",
  className,
}: {
  name: string;
  color: string;
  url?: string | null;
  size?: AvatarSize;
  className?: string;
}) {
  const initial = name.charAt(0).toUpperCase() || "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- avatar chico de Supabase Storage, sin optimizador
      <img
        src={url}
        alt={name}
        title={name}
        className={cn(
          "shrink-0 rounded-full object-cover",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        SIZES[size],
        className
      )}
      style={{ background: color }}
      title={name}
    >
      {initial}
    </span>
  );
}
