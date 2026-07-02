"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { searchAction, type SearchResult } from "@/lib/actions/search";

type NavItem = { label: string; icon: string; href: string; keywords: string };

const NAV: NavItem[] = [
  { label: "Hoy", icon: "☀️", href: "/hoy", keywords: "hoy tareas dia" },
  { label: "Semana", icon: "🗓️", href: "/semana", keywords: "semana calendario kanban" },
  { label: "Metas", icon: "🏁", href: "/metas", keywords: "metas empresa objetivos generales" },
  { label: "Proyectos", icon: "📁", href: "/proyectos", keywords: "proyectos" },
  { label: "Tiempos", icon: "⏱️", href: "/tiempos", keywords: "tiempos horas cronometro" },
  { label: "Novedades", icon: "📰", href: "/novedades", keywords: "novedades updates equipo" },
  { label: "Backlog", icon: "📥", href: "/backlog", keywords: "backlog sin agendar" },
  { label: "Hecho", icon: "✅", href: "/done", keywords: "hecho terminadas done" },
  { label: "Equipo", icon: "👥", href: "/equipo", keywords: "equipo miembros invitar" },
];

const TYPE_LABEL: Record<SearchResult["type"], string> = {
  proyecto: "Proyecto",
  objetivo: "Objetivo",
  meta: "Meta",
  tarea: "Tarea",
  persona: "Persona",
};

type Row =
  | { kind: "nav"; item: NavItem }
  | { kind: "result"; item: SearchResult };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqId = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setActive(0);
  }, []);

  // Abrir con Cmd/Ctrl+K o evento global; cerrar con Esc.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  // Buscar (debounced) en la base cuando cambia la query.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      const res = await searchAction(q);
      if (id === reqId.current) {
        setResults(res);
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Filas: navegación que matchea + resultados de la base.
  const rows: Row[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navMatches = q
      ? NAV.filter((n) => (n.label + " " + n.keywords).toLowerCase().includes(q))
      : NAV;
    return [
      ...navMatches.map((item) => ({ kind: "nav" as const, item })),
      ...results.map((item) => ({ kind: "result" as const, item })),
    ];
  }, [query, results]);

  useEffect(() => {
    setActive(0);
  }, [rows.length]);

  const go = useCallback(
    (row: Row) => {
      close();
      router.push(row.item.href);
    },
    [close, router]
  );

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const row = rows[active];
      if (row) go(row);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      <div className="relative z-[1] w-full max-w-xl overflow-hidden rounded-[22px] border border-[var(--glass-border)] bg-elevated shadow-[var(--shadow-2)]">
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4">
          <Search className="h-5 w-5 shrink-0 text-fg-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onListKey}
            placeholder="Buscar proyectos, objetivos, tareas… o ir a una sección"
            className="w-full bg-transparent py-4 font-body text-base text-fg outline-none placeholder:text-fg-disabled"
          />
          <kbd className="hidden shrink-0 rounded-md border border-[var(--glass-border)] px-1.5 py-0.5 font-body text-[10px] text-fg-muted sm:block">
            Esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {rows.length === 0 ? (
            <p className="px-3 py-8 text-center font-body text-sm text-fg-muted">
              {loading ? "Buscando…" : "Sin resultados."}
            </p>
          ) : (
            rows.map((row, i) => {
              const isActive = i === active;
              const label = row.item.label;
              const sub =
                row.kind === "nav" ? "Ir a la sección" : row.item.sublabel;
              const tag = row.kind === "result" ? TYPE_LABEL[row.item.type] : null;
              return (
                <button
                  key={`${row.kind}-${i}`}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(row)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive ? "bg-white/8" : "hover:bg-white/5"
                  }`}
                >
                  <span className="text-lg">{row.item.icon}</span>
                  <span className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="truncate font-body text-sm font-semibold text-fg">{label}</span>
                    {sub && <span className="truncate font-body text-xs text-fg-muted">{sub}</span>}
                  </span>
                  {tag && (
                    <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
                      {tag}
                    </span>
                  )}
                  {isActive && <CornerDownLeft className="h-4 w-4 shrink-0 text-fg-muted" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** Dispara la apertura del buscador desde cualquier botón. */
export function openCommandPalette() {
  window.dispatchEvent(new Event("open-command-palette"));
}
