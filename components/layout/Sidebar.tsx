"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  Target,
  Inbox,
  Plus,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/hoy", label: "Hoy", icon: CalendarCheck },
  { href: "/semana", label: "Semana", icon: CalendarDays },
  { href: "/backlog", label: "Backlog", icon: Inbox },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/objetivos", label: "Objetivos", icon: Target },
  { href: "/done", label: "Hecho", icon: CheckCircle2 },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export function Sidebar({ name, avatarColor }: { name: string; avatarColor: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const initial = name.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  async function logout() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* ── Desktop: panel de vidrio flotante ── */}
      <aside
        className={`liquid-glass sticky top-3 z-20 m-3 hidden h-[calc(100vh-1.5rem)] shrink-0 flex-col gap-2 rounded-[28px] p-3 transition-[width] duration-300 md:flex ${
          collapsed ? "w-[84px]" : "w-[264px]"
        }`}
      >
        {/* Avatar + saludo */}
        <div className="flex items-center gap-3 px-1 pt-1 pb-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-[var(--shadow-glow-sm)]"
            style={{ background: avatarColor }}
          >
            {initial}
          </span>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="font-body text-xs text-fg-muted">{greeting()} 👋</span>
              <span className="truncate font-primary text-base font-bold text-fg">{name}</span>
            </div>
          )}
        </div>

        {/* Toggle colapsar */}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expandir" : "Colapsar"}
          className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--glass-border)] bg-elevated text-fg-muted shadow-[var(--shadow-1)] transition-colors hover:text-accent-cyan"
        >
          {collapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </button>

        {!collapsed && (
          <span className="px-2 pb-1 font-body text-[10px] uppercase tracking-[0.14em] text-fg-muted">
            Menú
          </span>
        )}

        {/* Nav */}
        <nav className="flex flex-col gap-1.5">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 font-body text-sm font-semibold transition-all ${
                  active
                    ? "text-white shadow-[0_6px_20px_rgba(0,87,255,0.45)]"
                    : "text-fg-muted hover:bg-white/5 hover:text-fg"
                } ${collapsed ? "justify-center" : ""}`}
                style={active ? { background: "#0057FF" } : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Acción primaria flotante */}
        <button
          type="button"
          onClick={() => setNewTaskOpen(true)}
          title="Nueva tarea"
          className={`mt-auto flex items-center justify-center gap-2 rounded-2xl py-3 font-body text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,87,255,0.4)] transition-transform hover:scale-[1.02] ${
            collapsed ? "px-0" : "px-4"
          }`}
          style={{ background: "var(--brand-gradient)" }}
        >
          <Plus className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Nueva tarea</span>}
        </button>

        {/* Salir */}
        <button
          type="button"
          onClick={logout}
          className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-body text-sm font-medium text-fg-muted transition-colors hover:bg-white/5 hover:text-[var(--color-error)] ${
            collapsed ? "justify-center" : ""
          }`}
          title="Salir"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Salir</span>}
        </button>
      </aside>

      {/* ── Mobile: barra de vidrio arriba ── */}
      <div className="sticky top-0 z-20 flex items-center gap-2 p-3 md:hidden">
        <div className="liquid-glass flex w-full items-center gap-2 rounded-3xl px-3 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initial}
          </span>
          <nav className="flex flex-1 items-center justify-around">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    active ? "text-white" : "text-fg-muted"
                  }`}
                  style={active ? { background: "#0057FF" } : undefined}
                >
                  <Icon className="h-4 w-4" />
                  {active && <span>{label}</span>}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            aria-label="Salir"
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-[var(--color-error)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </>
  );
}
