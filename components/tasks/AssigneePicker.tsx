"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Plus, UserPlus } from "lucide-react";
import type { Member } from "@/lib/queries/members";
import { Avatar } from "@/components/ui/avatar";

const MENU_WIDTH = 208; // w-52

export type AssigneeLite = {
  id: string;
  full_name: string;
  avatar_color: string;
  avatar_url?: string | null;
};

/** Avatares apilados de los responsables (máx 3 + contador). */
export function AssigneeStack({
  assignees,
  size = "sm",
}: {
  assignees: AssigneeLite[];
  size?: "xs" | "sm";
}) {
  const shown = assignees.slice(0, 3);
  const extra = assignees.length - shown.length;
  return (
    <span className="flex items-center -space-x-2">
      {shown.map((a) => (
        <Avatar
          key={a.id}
          name={a.full_name}
          color={a.avatar_color}
          url={a.avatar_url}
          size={size}
          className="ring-2 ring-[var(--surface,#111)]"
        />
      ))}
      {extra > 0 && (
        <span
          className={`flex items-center justify-center rounded-full bg-white/10 font-bold text-fg-secondary ring-2 ring-[var(--surface,#111)] ${
            size === "xs" ? "h-6 w-6 text-[10px]" : "h-7 w-7 text-[11px]"
          }`}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

/**
 * Selector de responsables (varios por tarea).
 * - Admin: asigna/quita a cualquiera.
 * - Miembro: solo puede asignarse o quitarse a sí mismo.
 */
export function AssigneePicker({
  members,
  selected,
  onChange,
  canReassign,
  currentUserId,
  size = "sm",
}: {
  members: Member[];
  /** IDs de perfiles asignados. */
  selected: string[];
  onChange: (ids: string[]) => void;
  canReassign: boolean;
  currentUserId: string;
  size?: "xs" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function place() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let left = r.right - MENU_WIDTH;
    if (left < 8) left = 8;
    const maxRight = window.innerWidth - MENU_WIDTH - 8;
    if (left > maxRight) left = Math.max(8, maxRight);
    // Si hay poco espacio abajo y sí arriba, abrir hacia arriba.
    const up = r.bottom + 300 > window.innerHeight && r.top > window.innerHeight - r.bottom;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left, up });
  }

  // Reposicionar al abrir; cerrar si se hace scroll o cambia el tamaño (el menú
  // es fixed y quedaría "flotando" desalineado).
  useEffect(() => {
    if (!open) return;
    place();
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onScrollOrResize() {
      setOpen(false);
    }
    function onScroll(e: Event) {
      // Ignorar el scroll interno de la propia lista de responsables.
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  const assignees = members.filter((m) => selected.includes(m.id));
  const meSelected = selected.includes(currentUserId);

  function toggle(id: string) {
    if (!canReassign && id !== currentUserId) return;
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const menu =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: MENU_WIDTH,
              transform: pos.up ? "translateY(-100%)" : undefined,
              zIndex: 1000,
              maxHeight: "min(340px, 70vh)",
            }}
            className="flex flex-col gap-0.5 overflow-y-auto rounded-2xl border border-[var(--glass-border)] bg-elevated p-1.5 shadow-[var(--shadow-2)]"
          >
            <span className="px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
              Responsables
            </span>
            {canReassign ? (
              members.map((m) => {
                const on = selected.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-white/5"
                  >
                    <Avatar name={m.full_name} color={m.avatar_color} url={m.avatar_url} size="xs" />
                    <span className="flex-1 truncate font-body text-sm text-fg">
                      {m.full_name}
                      {m.id === currentUserId && <span className="text-fg-muted"> (tú)</span>}
                    </span>
                    {on && <Check className="h-4 w-4 shrink-0 text-accent-cyan" />}
                  </button>
                );
              })
            ) : (
              <button
                type="button"
                onClick={() => toggle(currentUserId)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-left font-body text-sm text-fg transition-colors hover:bg-white/5"
              >
                <UserPlus className="h-4 w-4 shrink-0 text-fg-muted" />
                {meSelected ? "Quitarme de la tarea" : "Asignarme esta tarea"}
              </button>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title="Responsables"
        className="flex items-center gap-1 rounded-full transition-transform hover:scale-105"
      >
        {assignees.length > 0 ? (
          <AssigneeStack assignees={assignees} size={size} />
        ) : (
          <span
            className={`flex items-center justify-center rounded-full border border-dashed border-[var(--border-default)] text-fg-muted transition-colors hover:border-[var(--border-active)] hover:text-fg ${
              size === "xs" ? "h-6 w-6" : "h-7 w-7"
            }`}
          >
            <Plus className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </span>
        )}
      </button>
      {menu}
    </>
  );
}
