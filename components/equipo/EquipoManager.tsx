"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, UserPlus, Trash2, Clock, Pencil, AlertTriangle } from "lucide-react";
import type { Member, PendingInvite } from "@/lib/queries/members";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { roleLabel } from "@/lib/roles";
import {
  inviteMemberAction,
  setMemberRoleAction,
  removeMemberAction,
  cancelInviteAction,
  renameWorkspaceAction,
  deleteWorkspaceAction,
} from "@/lib/actions/workspace";

type Props = {
  workspaceName: string;
  teamId: string;
  isOwner: boolean;
  /** false si es el único espacio del usuario (no se puede borrar). */
  canDelete: boolean;
  currentUserId: string;
  members: Member[];
  invites: PendingInvite[];
};

export function EquipoManager({
  workspaceName,
  teamId,
  isOwner,
  canDelete,
  currentUserId,
  members,
  invites,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function invite() {
    const clean = email.trim();
    if (!clean) return;
    startTransition(async () => {
      const res = await inviteMemberAction(clean, role);
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      setEmail("");
      setMsg(
        res.status === "added"
          ? "Añadido al espacio."
          : res.status === "exists"
            ? "Esa persona ya está en el espacio."
            : "Invitación enviada. Entrará al registrarse con ese email."
      );
      router.refresh();
    });
  }

  function changeRole(userId: string, newRole: "admin" | "member") {
    startTransition(async () => {
      await setMemberRoleAction(userId, newRole);
      router.refresh();
    });
  }

  function remove(userId: string) {
    startTransition(async () => {
      await removeMemberAction(userId);
      router.refresh();
    });
  }

  function cancel(inviteId: string) {
    startTransition(async () => {
      await cancelInviteAction(inviteId);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {workspaceName}
        </span>
        <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
          Equipo
        </h1>
        <p className="font-body text-sm text-fg-muted">
          Invitá personas por email y definí quién es admin y quién empleado.
        </p>
      </header>

      {/* Invitar por email */}
      <section className="card-soft flex flex-col gap-3 rounded-[26px] p-5">
        <span className="flex items-center gap-2 font-body text-sm font-semibold text-fg">
          <UserPlus className="h-4 w-4 text-accent-cyan" /> Invitar a alguien
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-2xl border border-[var(--border-default)] bg-white/5 px-3">
            <Mail className="h-4 w-4 shrink-0 text-fg-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && invite()}
              placeholder="email@ejemplo.com"
              className="w-full bg-transparent py-2.5 font-body text-sm text-fg outline-none placeholder:text-fg-disabled"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "member")}
            className="rounded-2xl border border-[var(--border-default)] bg-white/5 px-3 py-2.5 font-body text-sm text-fg outline-none"
          >
            <option value="member">Empleado</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="button"
            onClick={invite}
            disabled={pending || !email.trim()}
            className="rounded-2xl px-5 py-2.5 font-body text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "var(--brand-gradient)" }}
          >
            Invitar
          </button>
        </div>
        {msg && <p className="font-body text-xs text-fg-muted">{msg}</p>}
      </section>

      {/* Miembros */}
      <section className="flex flex-col gap-2">
        <span className="px-1 font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
          Miembros ({members.length})
        </span>
        {members.map((m) => {
          const isMe = m.id === currentUserId;
          const isOwner = m.role === "owner";
          return (
            <div key={m.id} className="card-soft flex items-center gap-3 rounded-[22px] p-4">
              <Avatar name={m.full_name} color={m.avatar_color} url={m.avatar_url} size="lg" />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate font-body text-sm font-semibold text-fg">
                  {m.full_name} {isMe && <span className="text-fg-muted">(tú)</span>}
                </span>
                <span className="font-body text-xs text-fg-muted">{roleLabel(m.role)}</span>
              </div>

              {/* El dueño no se toca; a mí mismo tampoco me cambio/quito acá. */}
              {!isOwner && !isMe && (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role === "admin" ? "admin" : "member"}
                    onChange={(e) => changeRole(m.id, e.target.value as "admin" | "member")}
                    disabled={pending}
                    className="rounded-xl border border-[var(--border-default)] bg-white/5 px-2.5 py-1.5 font-body text-xs text-fg outline-none"
                  >
                    <option value="member">Empleado</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => remove(m.id)}
                    disabled={pending}
                    aria-label="Quitar del equipo"
                    className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Invitaciones pendientes */}
      {invites.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="px-1 font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
            Invitaciones pendientes ({invites.length})
          </span>
          {invites.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 rounded-[22px] border border-dashed border-[var(--border-default)] p-4"
            >
              <Clock className="h-4 w-4 shrink-0 text-fg-muted" />
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate font-body text-sm text-fg">{inv.email}</span>
                <span className="font-body text-xs text-fg-muted">
                  {roleLabel(inv.role)} · sin registrar todavía
                </span>
              </div>
              <button
                type="button"
                onClick={() => cancel(inv.id)}
                disabled={pending}
                aria-label="Cancelar invitación"
                className="text-fg-disabled transition-colors hover:text-[var(--color-error)]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Ajustes del espacio: renombrar (owner/admin) + borrar (solo dueño) */}
      <WorkspaceSettings
        workspaceName={workspaceName}
        teamId={teamId}
        isOwner={isOwner}
        canDelete={canDelete}
      />
    </div>
  );
}

/** Renombrar el espacio y (para el dueño) borrarlo con doble confirmación. */
function WorkspaceSettings({
  workspaceName,
  teamId,
  isOwner,
  canDelete,
}: {
  workspaceName: string;
  teamId: string;
  isOwner: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState(workspaceName);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = name.trim() !== workspaceName && name.trim() !== "";

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await renameWorkspaceAction(teamId, name);
      if (res.ok) {
        setMsg("Nombre actualizado.");
        router.refresh();
      } else {
        setMsg(res.error);
      }
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const res = await deleteWorkspaceAction(teamId);
      if (res.ok) {
        setConfirmOpen(false);
        router.push("/hoy");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <section className="flex flex-col gap-3">
      <span className="px-1 font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
        Ajustes del espacio
      </span>

      {/* Renombrar */}
      <div className="card-soft flex flex-col gap-3 rounded-[26px] p-5">
        <span className="flex items-center gap-2 font-body text-sm font-semibold text-fg">
          <Pencil className="h-4 w-4 text-accent-cyan" /> Nombre del espacio
        </span>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && dirty && save()}
            className="flex-1 rounded-2xl border border-[var(--border-default)] bg-white/5 px-3 py-2.5 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
          />
          <Button onClick={save} disabled={pending || !dirty}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
        {msg && <p className="font-body text-xs text-fg-muted">{msg}</p>}
      </div>

      {/* Zona de peligro (solo el dueño) */}
      {isOwner && (
        <div className="flex flex-col gap-3 rounded-[26px] border border-[color-mix(in_srgb,var(--color-error)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-error)_7%,transparent)] p-5">
          <span className="flex items-center gap-2 font-body text-sm font-semibold text-[var(--color-error)]">
            <AlertTriangle className="h-4 w-4" /> Zona de peligro
          </span>
          <p className="font-body text-sm text-fg-secondary">
            Borrar este espacio elimina <strong>para siempre</strong> todos sus proyectos,
            objetivos, tareas, tiempos y miembros. No se puede deshacer.
          </p>
          {canDelete ? (
            <Button
              variant="destructive"
              className="w-fit"
              onClick={() => {
                setConfirmText("");
                setError(null);
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" /> Borrar este espacio
            </Button>
          ) : (
            <p className="font-body text-xs text-fg-muted">
              Es tu único espacio, así que no se puede borrar. Creá otro primero si querés
              eliminar este.
            </p>
          )}
        </div>
      )}

      {/* Confirmación fuerte: escribir el nombre exacto */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Borrar “{workspaceName}”</DialogTitle>
            <DialogDescription>
              Esto elimina <strong>todo</strong> el contenido del espacio y no se puede
              deshacer. Para confirmar, escribí el nombre exacto del espacio.
            </DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={workspaceName}
            className="rounded-2xl border border-[var(--border-default)] bg-surface px-3 py-2.5 font-body text-sm text-fg outline-none focus:border-[var(--border-active)]"
          />
          {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={remove}
              disabled={pending || confirmText.trim() !== workspaceName}
            >
              {pending ? "Borrando…" : "Borrar definitivamente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
