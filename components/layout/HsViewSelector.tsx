"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, Eye, User as UserIcon, Layers } from "lucide-react";
import type { HsView } from "@/lib/queries/hsView";
import { setHsViewAction, setHsSpacesAction } from "@/lib/actions/hsView";

export type WorkspaceLite = { team_id: string; name: string };

const MODES: { value: HsView; label: string; hint: string; icon: typeof UserIcon }[] = [
  { value: "mine", label: "Solo mías", hint: "Este espacio", icon: UserIcon },
  { value: "team", label: "Mías + equipo", hint: "Este espacio", icon: Eye },
  { value: "mine_all", label: "Solo mías", hint: "Todos los espacios", icon: Layers },
];

/**
 * Selector de vista para Hoy y Semana:
 * mine (solo yo · este espacio) / team (yo + equipo · este espacio) /
 * mine_all (solo yo · varios espacios, con checklist de espacios).
 */
export function HsViewSelector({
  view,
  workspaces,
  selectedSpaces,
}: {
  view: HsView;
  workspaces: WorkspaceLite[];
  /** null = todos los espacios elegidos. */
  selectedSpaces: string[] | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = MODES.find((m) => m.value === view) ?? MODES[0];
  const chosen = selectedSpaces ?? workspaces.map((w) => w.team_id);

  function pickMode(v: HsView) {
    startTransition(async () => {
      await setHsViewAction(v);
      router.refresh();
    });
  }

  function toggleSpace(id: string) {
    // No permitir quedarse sin ningún espacio elegido.
    const next = chosen.includes(id) ? chosen.filter((s) => s !== id) : [...chosen, id];
    if (next.length === 0) return;
    startTransition(async () => {
      // Si quedan todos, guardamos vacío (= todos); si no, la lista.
      await setHsSpacesAction(next.length === workspaces.length ? [] : next);
      router.refresh();
    });
  }

  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-white/5 px-3.5 py-2 font-body text-sm font-semibold text-fg-secondary transition-colors hover:border-[var(--border-active)]"
      >
        <CurrentIcon className="h-4 w-4 shrink-0" />
        <span className="flex flex-col items-start leading-none">
          <span className="text-fg">{current.label}</span>
          <span className="text-[10px] font-medium text-fg-muted">{current.hint}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-fg-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-40 flex w-64 flex-col gap-1 rounded-2xl border border-[var(--glass-border)] bg-elevated p-2 shadow-[var(--shadow-2)]">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = m.value === view;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => pickMode(m.value)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/5"
              >
                <Icon className="h-4 w-4 shrink-0 text-fg-muted" />
                <span className="flex flex-1 flex-col leading-tight">
                  <span className="font-body text-sm font-semibold text-fg">{m.label}</span>
                  <span className="font-body text-[11px] text-fg-muted">{m.hint}</span>
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-accent-cyan" />}
              </button>
            );
          })}

          {/* Checklist de espacios (solo relevante en "mine_all") */}
          {view === "mine_all" && workspaces.length > 1 && (
            <>
              <div className="my-1 h-px bg-[var(--glass-border)]" />
              <span className="px-2.5 pb-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                Ver de estos espacios
              </span>
              {workspaces.map((w) => {
                const on = chosen.includes(w.team_id);
                return (
                  <button
                    key={w.team_id}
                    type="button"
                    onClick={() => toggleSpace(w.team_id)}
                    className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left transition-colors hover:bg-white/5"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                        on ? "border-transparent bg-accent-cyan text-white" : "border-[var(--border-default)]"
                      }`}
                    >
                      {on && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 truncate font-body text-sm text-fg">{w.name}</span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
