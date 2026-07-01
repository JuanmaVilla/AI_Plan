"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ProjectWithStats, ProjectType } from "@/lib/queries/projects";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { OrbitView } from "@/components/projects/OrbitView";

type View = "normal" | "orbit";

export function ProjectsWorkspace({
  projects,
  type,
  copy,
}: {
  projects: ProjectWithStats[];
  type: ProjectType;
  copy: { kicker: string; title: string; empty: string };
}) {
  const [view, setView] = useState<View>("normal");
  const reduce = useReducedMotion();

  // Recordar la vista elegida.
  useEffect(() => {
    const saved = localStorage.getItem("projects-view");
    if (saved === "orbit" || saved === "normal") setView(saved);
  }, []);

  function changeView(v: View) {
    setView(v);
    localStorage.setItem("projects-view", v);
  }

  const fade = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.15 } }
    : {
        initial: { opacity: 0, scale: 0.98, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.98, y: -8 },
        transition: { duration: 0.28, ease: [0.2, 0.7, 0.2, 1] as const },
      };

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
            {copy.kicker}
          </span>
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            {copy.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={changeView} />
          <NewProjectDialog type={type} />
        </div>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] px-6 py-12 text-center font-body text-fg-muted">
          {copy.empty}
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {view === "normal" ? (
            <motion.div key="normal" {...fade}>
              <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="orbit" {...fade}>
              <OrbitView projects={projects} />
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const options: { id: View; label: string; icon: string }[] = [
    { id: "normal", label: "Normal", icon: "▦" },
    { id: "orbit", label: "Orbit", icon: "🪐" },
  ];
  return (
    <div className="relative flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-white/5 p-1 backdrop-blur">
      {options.map((o) => {
        const active = view === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            aria-pressed={active}
            className="relative flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-body text-sm transition-colors"
          >
            {active && (
              <motion.span
                layoutId="view-toggle-pill"
                className="absolute inset-0 rounded-full bg-white/12"
                style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className={`relative ${active ? "text-fg" : "text-fg-muted"}`}>{o.icon}</span>
            <span className={`relative ${active ? "font-semibold text-fg" : "text-fg-muted"}`}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
