"use client";

import { useState, useTransition } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { NewsEntryWithMeta } from "@/lib/queries/news";
import { deleteNewsAction } from "@/app/(app)/novedades/actions";

function formatDay(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return "Hoy";
  if (isYesterday(d)) return "Ayer";
  return format(d, "EEEE d 'de' MMMM", { locale: es });
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ background: color }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function EntryCard({ entry, canDelete }: { entry: NewsEntryWithMeta; canDelete: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(() => deleteNewsAction(entry.id));
  }

  return (
    <div className="glass-card rounded-[26px] p-5 transition-all">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar name={entry.author.full_name} color={entry.author.avatar_color} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm font-semibold text-fg">
              {entry.author.full_name}
            </span>
            {entry.project && (
              <span
                className="rounded-full px-2 py-0.5 font-body text-[11px] font-semibold"
                style={{
                  color: entry.project.color,
                  background: `${entry.project.color}20`,
                }}
              >
                {entry.project.icon} {entry.project.name}
              </span>
            )}
          </div>
          <span className="font-body text-xs text-fg-muted">
            {format(parseISO(entry.created_at), "HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="rounded-lg p-1 text-fg-disabled hover:text-fg-muted"
            aria-label={expanded ? "Colapsar" : "Expandir"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {canDelete && (
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="rounded-lg p-1 text-fg-disabled transition-colors hover:text-[var(--color-error)] disabled:opacity-40"
              aria-label="Borrar novedad"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="mt-4 flex flex-col gap-3">
          {/* Avances */}
          <div className="flex flex-col gap-1.5">
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-cyan">
              ✓ Avances
            </span>
            <ul className="flex flex-col gap-1">
              {entry.advances.map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />
                  <span className="font-body text-sm text-fg-secondary">{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {entry.problem && (
            <div className="flex flex-col gap-1.5">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-warning)]">
                ⚠ Problema
              </span>
              <p className="font-body text-sm text-fg-secondary">{entry.problem}</p>
            </div>
          )}

          {entry.next_steps && (
            <div className="flex flex-col gap-1.5">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-mint">
                → Próximos pasos
              </span>
              <p className="font-body text-sm text-fg-secondary">{entry.next_steps}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function NewsFeed({
  entries,
  currentUserId,
  canModerate,
}: {
  entries: NewsEntryWithMeta[];
  currentUserId: string;
  /** Admin: puede borrar novedades de cualquiera. */
  canModerate: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-[var(--border-default)] py-12 text-center">
        <span className="text-3xl">📋</span>
        <p className="font-body text-sm text-fg-muted">
          Todavía no hay novedades. ¡Publicá la primera!
        </p>
      </div>
    );
  }

  // Agrupar por fecha
  const byDay = new Map<string, NewsEntryWithMeta[]>();
  for (const entry of entries) {
    const day = entry.for_date;
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(entry);
  }

  return (
    <div className="flex flex-col gap-8">
      {[...byDay.entries()].map(([day, dayEntries]) => (
        <section key={day} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-body text-sm font-bold capitalize text-fg">
              {formatDay(day)}
            </span>
            <div className="flex-1 border-t border-[var(--border-default)]" />
            <span className="font-body text-xs text-fg-muted">
              {dayEntries.length} {dayEntries.length === 1 ? "novedad" : "novedades"}
            </span>
          </div>
          {dayEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              canDelete={canModerate || entry.author.id === currentUserId}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
