"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  Flag,
  Inbox,
  Newspaper,
  Users,
  Plus,
  Check,
  ChevronsUpDown,
  Eye,
  Search,
  User as UserIcon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { openCommandPalette } from "@/components/search/CommandPalette";
import {
  setActiveWorkspaceAction,
  createWorkspaceAction,
  setViewScopeAction,
} from "@/lib/actions/workspace";
import { isAdmin } from "@/lib/roles";
import type { Workspace } from "@/lib/queries/teams";
import type { ViewScope } from "@/lib/queries/scope";

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/hoy", label: "Hoy", icon: CalendarCheck },
  { href: "/semana", label: "Semana", icon: CalendarDays },
  { href: "/metas", label: "Metas", icon: Flag },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban },
  { href: "/tiempos", label: "Tiempos", icon: Clock },
  { href: "/novedades", label: "Novedades", icon: Newspaper },
  { href: "/backlog", label: "Backlog", icon: Inbox },
  { href: "/done", label: "Hecho", icon: CheckCircle2 },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

type SidebarProps = {
  name: string;
  avatarColor: string;
  teams: Workspace[];
  activeTeamId: string | null;
  role: string;
  viewScope: ViewScope;
};

export function Sidebar({ name, avatarColor, teams, activeTeamId, role, viewScope }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const initial = name.charAt(0).toUpperCase() || "?";
  const admin = isAdmin(role);

  const links = admin ? [...LINKS, { href: "/equipo", label: "Equipo", icon: Users }] : LINKS;

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
        className={`liquid-glass sticky top-3 z-20 m-3 hidden h-[calc(100vh-1.5rem)] shrink-0 self-start flex-col gap-2 rounded-[28px] p-3 transition-[width] duration-300 md:flex ${
          collapsed ? "w-[84px]" : "w-[264px]"
        }`}
      >
        {/* Marca */}
        {!collapsed && (
          <div className="flex flex-col px-1 pt-1 leading-none">
            <span className="text-gradient font-display text-lg font-black tracking-tight">
              AI Plan
            </span>
            <span className="font-body text-[9px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
              by Hay Equipo IA
            </span>
          </div>
        )}

        {/* Avatar + saludo */}
        <div className="flex items-center gap-3 px-1 pt-1 pb-2">
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

        {/* Selector de espacio de trabajo */}
        <WorkspaceSwitcher
          teams={teams}
          activeTeamId={activeTeamId}
          collapsed={collapsed}
          canCreate
        />

        {/* Buscar (Cmd/Ctrl+K) */}
        <button
          type="button"
          onClick={() => openCommandPalette()}
          title="Buscar (⌘K)"
          className={`flex items-center gap-2.5 rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2 font-body text-sm text-fg-muted transition-colors hover:bg-white/10 hover:text-fg ${
            collapsed ? "justify-center px-0" : "px-3"
          }`}
        >
          <Search className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Buscar</span>
              <kbd className="rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 font-body text-[10px] text-fg-muted">
                ⌘K
              </kbd>
            </>
          )}
        </button>

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
          {links.map(({ href, label, icon: Icon }) => {
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

        {/* Filtro global "solo lo mío" */}
        <ScopeToggle scope={viewScope} collapsed={collapsed} />

        {/* Crear (guiado: proyecto → objetivo → tarea) */}
        <div className="mt-auto">
          <CreateMenu collapsed={collapsed} onNewTask={() => setNewTaskOpen(true)} />
        </div>

        {/* Tema claro/oscuro */}
        <ThemeToggle collapsed={collapsed} />

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
      <div className="sticky top-0 z-20 flex flex-col gap-2 p-3 md:hidden">
        <div className="liquid-glass flex w-full items-center gap-2 rounded-3xl px-3 py-2">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ background: avatarColor }}
          >
            {initial}
          </span>
          <nav className="flex flex-1 items-center justify-around">
            {links.map(({ href, label, icon: Icon }) => {
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
            onClick={() => openCommandPalette()}
            aria-label="Buscar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-fg"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={logout}
            aria-label="Salir"
            className="flex h-8 w-8 items-center justify-center rounded-full text-fg-muted hover:text-[var(--color-error)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
        {/* Espacio + filtro en móvil */}
        <div className="liquid-glass flex w-full items-center gap-2 rounded-3xl px-3 py-2">
          <WorkspaceSwitcher teams={teams} activeTeamId={activeTeamId} collapsed={false} canCreate />
          <ScopeToggle scope={viewScope} collapsed compact />
        </div>
      </div>

      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
    </>
  );
}

/** Selector desplegable de espacio de trabajo + crear nuevo. */
function WorkspaceSwitcher({
  teams,
  activeTeamId,
  collapsed,
  canCreate,
}: {
  teams: Workspace[];
  activeTeamId: string | null;
  collapsed: boolean;
  canCreate: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  const active = teams.find((t) => t.team_id === activeTeamId) ?? teams[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function switchTo(teamId: string) {
    if (teamId === activeTeamId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setActiveWorkspaceAction(teamId);
      setOpen(false);
      router.refresh();
    });
  }

  function create() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createWorkspaceAction(name);
      if (res.ok) {
        setNewName("");
        setCreating(false);
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => router.push("/equipo")}
        title={active?.name ?? "Espacio"}
        className="flex items-center justify-center rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2.5 text-fg-muted transition-colors hover:text-fg"
      >
        <FolderKanban className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 px-3 py-2 text-left transition-colors hover:bg-white/10"
      >
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="font-body text-[10px] uppercase tracking-[0.12em] text-fg-muted">Espacio</span>
          <span className="truncate font-body text-sm font-semibold text-fg">
            {active?.name ?? "Sin espacio"}
          </span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 flex flex-col gap-1 rounded-2xl border border-[var(--glass-border)] bg-elevated p-2 shadow-[var(--shadow-2)]">
          {teams.map((t) => (
            <button
              key={t.team_id}
              type="button"
              onClick={() => switchTo(t.team_id)}
              disabled={pending}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left font-body text-sm text-fg transition-colors hover:bg-white/5"
            >
              <span className="flex-1 truncate">{t.name}</span>
              {t.team_id === active?.team_id && <Check className="h-4 w-4 shrink-0 text-accent-cyan" />}
            </button>
          ))}

          {canCreate && (
            <>
              <div className="my-1 h-px bg-[var(--glass-border)]" />
              {creating ? (
                <div className="flex flex-col gap-1.5 p-1">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && create()}
                    placeholder="Nombre del espacio"
                    className="rounded-xl border border-[var(--glass-border)] bg-white/5 px-2.5 py-1.5 font-body text-sm text-fg outline-none focus:border-accent-cyan"
                  />
                  <button
                    type="button"
                    onClick={create}
                    disabled={pending || !newName.trim()}
                    className="rounded-xl py-1.5 font-body text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: "var(--brand-gradient)" }}
                  >
                    Crear
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left font-body text-sm font-semibold text-accent-cyan transition-colors hover:bg-white/5"
                >
                  <Plus className="h-4 w-4" /> Crear espacio
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Menú "Crear" guiado. Refuerza la jerarquía (proyecto → objetivo → tarea)
 * y de-enfatiza el crear tarea suelta (ya no es la acción gigante de antes).
 */
function CreateMenu({ collapsed, onNewTask }: { collapsed: boolean; onNewTask: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items: { label: string; hint: string; icon: string; onClick: () => void }[] = [
    { label: "Proyecto", hint: "Lo más grande", icon: "📁", onClick: () => router.push("/proyectos") },
    { label: "Objetivo", hint: "Dentro de un proyecto", icon: "🎯", onClick: () => router.push("/proyectos") },
    { label: "Tarea", hint: "Dentro de un objetivo", icon: "✅", onClick: onNewTask },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Crear"
        className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--glass-border)] bg-white/5 py-2.5 font-body text-sm font-semibold text-fg transition-colors hover:bg-white/10 ${
          collapsed ? "px-0" : "px-4"
        }`}
      >
        <Plus className="h-5 w-5 shrink-0" />
        {!collapsed && <span>Crear</span>}
      </button>

      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-30 flex flex-col gap-1 rounded-2xl border border-[var(--glass-border)] bg-elevated p-2 shadow-[var(--shadow-2)]">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
            >
              <span className="text-lg">{it.icon}</span>
              <span className="flex flex-col leading-tight">
                <span className="font-body text-sm font-semibold text-fg">{it.label}</span>
                <span className="font-body text-[11px] text-fg-muted">{it.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Interruptor global "solo lo mío" (guarda cookie y refresca todo). */
function ScopeToggle({
  scope,
  collapsed,
  compact,
}: {
  scope: ViewScope;
  collapsed: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const mine = scope === "mine";

  function flip() {
    startTransition(async () => {
      await setViewScopeAction(mine ? "all" : "mine");
      router.refresh();
    });
  }

  const Icon = mine ? UserIcon : Eye;
  const label = mine ? "Solo lo mío" : "Ver todo";

  if (compact) {
    return (
      <button
        type="button"
        onClick={flip}
        disabled={pending}
        title={label}
        aria-pressed={mine}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
          mine ? "text-white" : "text-fg-muted"
        }`}
        style={mine ? { background: "#0057FF" } : undefined}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={flip}
      disabled={pending}
      title={label}
      aria-pressed={mine}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-body text-sm font-semibold transition-colors ${
        mine ? "text-white" : "text-fg-muted hover:bg-white/5 hover:text-fg"
      } ${collapsed ? "justify-center" : ""}`}
      style={mine ? { background: "#0057FF" } : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{label}</span>}
    </button>
  );
}
