"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, FolderKanban, Target, type LucideIcon } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/hoy", label: "Hoy", icon: CalendarCheck },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/objetivos", label: "Objetivos", icon: Target },
];

export function Sidebar({
  name,
  avatarColor,
}: {
  name: string;
  avatarColor: string;
}) {
  const pathname = usePathname();
  const initial = name.charAt(0).toUpperCase() || "?";

  return (
    <aside className="sticky top-0 flex h-auto shrink-0 flex-row items-center gap-2 border-b border-[var(--border-default)] bg-surface px-4 py-3 md:h-screen md:w-[248px] md:flex-col md:items-stretch md:gap-2 md:border-r md:border-b-0 md:px-4 md:py-6">
      {/* Marca */}
      <Link href="/hoy" className="flex items-center gap-2.5 md:px-2 md:pb-6">
        <span
          className="h-7 w-7 shrink-0 rounded-[var(--radius-sm)] shadow-[var(--shadow-glow-sm)]"
          style={{ background: "var(--brand-gradient)" }}
        />
        <span className="hidden font-display text-base font-bold tracking-tight text-fg sm:inline">
          Hay Equipo
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-row gap-1 md:flex-col md:flex-none">
        <span className="hidden px-2 pt-2 pb-1 font-body text-[10px] uppercase tracking-[0.12em] text-fg-muted md:block">
          Menú
        </span>
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 font-body text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--accent-blue-dim)] text-fg shadow-[inset_2px_0_0_var(--accent-cyan)]"
                  : "text-fg-muted hover:bg-elevated hover:text-fg-secondary"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer: identidad + salir */}
      <div className="flex items-center gap-2 md:mt-auto md:flex-col md:items-stretch md:gap-3">
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-base px-3 py-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full font-body text-[11px] font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initial}
          </span>
          <span className="hidden font-body text-sm font-semibold text-fg-secondary sm:inline">
            {name}
          </span>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
