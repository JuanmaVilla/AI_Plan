"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { ProjectWithStats } from "@/lib/queries/projects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { OrbitMini } from "@/components/projects/OrbitMini";

const CARD_W = 360;

export function OrbitView({ projects }: { projects: ProjectWithStats[] }) {
  const [selected, setSelected] = useState(0);
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(960);

  useEffect(() => {
    function measure() {
      if (wrapRef.current) setWidth(wrapRef.current.getBoundingClientRect().width);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const n = projects.length;
  const clamp = (i: number) => ((i % n) + n) % n;

  // Mantener el índice válido si cambia la cantidad de proyectos.
  useEffect(() => {
    if (selected > n - 1) setSelected(Math.max(0, n - 1));
  }, [n, selected]);

  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setSelected((s) => clamp(s + 1));
      if (e.key === "ArrowLeft") setSelected((s) => clamp(s - 1));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const radius = Math.min(width * 0.3, 340);
  const step = Math.min((2 * Math.PI) / n, 0.62);
  const single = n === 1;

  return (
    <div
      ref={wrapRef}
      onWheel={(e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY) + 4) {
          if (e.deltaX > 10) setSelected((s) => clamp(s + 1));
          else if (e.deltaX < -10) setSelected((s) => clamp(s - 1));
        }
      }}
      className="orbit-scene relative flex h-[64vh] min-h-[520px] w-full select-none items-center justify-center overflow-hidden"
      style={{ perspective: 1600 }}
    >
      {projects.map((p, i) => {
        let d = i - selected;
        if (d > n / 2) d -= n;
        if (d < -n / 2) d += n;

        const ang = d * step;
        const depth = Math.cos(ang); // 1 al frente, -1 atrás
        const isSel = i === selected;

        const x = single ? 0 : Math.sin(ang) * radius;
        const scale = isSel ? 1.18 : 0.6 + (depth * 0.5 + 0.5) * 0.28;
        const rotateY = reduce || single ? 0 : (-ang * 180) / Math.PI * 0.34;
        const y = isSel ? 0 : -(1 - depth) * 16 - 6;
        const opacity = isSel ? 1 : Math.max(0.55, depth * 0.5 + 0.5);
        const blur = reduce ? 0 : isSel ? 0 : (1 - (depth * 0.5 + 0.5)) * 2.5 + 0.5;
        const zIndex = isSel ? 100 : Math.round((depth * 0.5 + 0.5) * 40) + 30;

        return (
          <motion.div
            key={p.id}
            className="absolute"
            style={{ width: CARD_W, zIndex, transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ x, y, scale, rotateY, opacity, filter: `blur(${blur}px)` }}
            transition={
              reduce
                ? { duration: 0.2 }
                : { type: "spring", stiffness: 120, damping: 20, mass: 0.9 }
            }
            drag={isSel && !single ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              if (info.offset.x < -70) setSelected((s) => clamp(s + 1));
              else if (info.offset.x > 70) setSelected((s) => clamp(s - 1));
            }}
          >
            {isSel ? (
              <ProjectCard project={p} />
            ) : (
              <button
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Ver ${p.name}`}
                className="w-full cursor-pointer text-left"
              >
                <OrbitMini project={p} />
              </button>
            )}
          </motion.div>
        );
      })}

      {/* Controles */}
      {!single && (
        <>
          <OrbitArrow side="left" onClick={() => setSelected((s) => clamp(s - 1))} />
          <OrbitArrow side="right" onClick={() => setSelected((s) => clamp(s + 1))} />
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {projects.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelected(i)}
                aria-label={`Ir a ${p.name}`}
                className="h-2 rounded-full transition-all"
                style={{
                  width: i === selected ? 20 : 8,
                  background: i === selected ? (p.color || "#5b8def") : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function OrbitArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Anterior" : "Siguiente"}
      className={`glass-card absolute top-1/2 z-[150] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-lg text-fg-secondary transition-transform hover:scale-110 ${
        side === "left" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
