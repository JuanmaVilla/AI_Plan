"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

type SlideVisual = (reduce: boolean) => React.ReactNode;

type Slide = {
  key: string;
  kicker: string;
  title: string;
  body: string;
  accent: string;
  visual: SlideVisual;
};

/* ─────────────────────────── Visuales animados ─────────────────────────── */

function FloatEmoji({ emoji, reduce, size = "text-8xl" }: { emoji: string; reduce: boolean; size?: string }) {
  return (
    <motion.div
      className={size}
      animate={reduce ? {} : { y: [0, -14, 0], rotate: [0, 3, -3, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {emoji}
    </motion.div>
  );
}

/** Cascada Meta → Proyecto → Objetivo → Tarea, apareciendo en orden. */
function HierarchyVisual(reduce: boolean) {
  const levels = [
    { icon: "🏁", label: "Meta", hint: "A dónde querés llegar", color: "#0057FF" },
    { icon: "📁", label: "Proyecto", hint: "El trabajo concreto", color: "#0cc0df" },
    { icon: "🎯", label: "Objetivo", hint: "Con su KPI", color: "#00d68f" },
    { icon: "✅", label: "Tarea", hint: "La acción de hoy", color: "#ffb020" },
  ];
  return (
    <div className="flex w-full max-w-sm flex-col items-stretch gap-2">
      {levels.map((l, i) => (
        <motion.div
          key={l.label}
          initial={reduce ? { opacity: 0 } : { opacity: 0, x: -30, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ delay: 0.25 + i * 0.28, type: "spring", stiffness: 200, damping: 18 }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur"
          style={{ marginLeft: i * 22 }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-2xl"
            style={{ background: `${l.color}22` }}
          >
            {l.icon}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-primary text-base font-bold text-white">{l.label}</span>
            <span className="font-body text-xs text-white/60">{l.hint}</span>
          </span>
          {i < levels.length - 1 && (
            <motion.span
              aria-hidden
              className="ml-auto text-white/40"
              animate={reduce ? {} : { y: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            >
              ↓
            </motion.span>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/** Chips de secciones flotando (para la slide de recorrido). */
function SectionsVisual(reduce: boolean) {
  const chips = [
    { icon: "☀️", label: "Hoy" },
    { icon: "🗓️", label: "Semana" },
    { icon: "🏁", label: "Metas" },
    { icon: "📁", label: "Proyectos" },
    { icon: "⏱️", label: "Tiempos" },
    { icon: "📰", label: "Novedades" },
  ];
  return (
    <div className="flex max-w-md flex-wrap justify-center gap-3">
      {chips.map((c, i) => (
        <motion.div
          key={c.label}
          initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.15 + i * 0.12, type: "spring", stiffness: 260, damping: 16 }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 font-body text-sm font-semibold text-white backdrop-blur"
        >
          <span className="text-lg">{c.icon}</span>
          {c.label}
        </motion.div>
      ))}
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    key: "welcome",
    kicker: "Bienvenido a AI Plan · by Hay Equipo IA",
    title: "Organizarte sin saturarte",
    body: "Un lugar simple para saber qué hacer hoy y por qué. Pensado para emprendedores y equipos chicos que quieren claridad, no más caos.",
    accent: "#0057FF",
    visual: (r) => <FloatEmoji emoji="🧭" reduce={r} />,
  },
  {
    key: "hierarchy",
    kicker: "La idea clave",
    title: "De lo grande a lo concreto",
    body: "Todo baja en cascada: tus Metas guían los Proyectos, cada Proyecto tiene Objetivos con KPI, y de ahí salen las Tareas. Así cada tarea tiene un porqué.",
    accent: "#0cc0df",
    visual: HierarchyVisual,
  },
  {
    key: "hoy",
    kicker: "Tu pantalla principal",
    title: "Hoy: solo lo de hoy",
    body: "Al entrar ves las tareas que te tocan hoy y tu cronómetro de trabajo. Calmado y al grano: sin listas infinitas.",
    accent: "#00d68f",
    visual: (r) => <FloatEmoji emoji="☀️" reduce={r} />,
  },
  {
    key: "plan",
    kicker: "Planificá",
    title: "Metas, Proyectos y Objetivos",
    body: "En Metas definís a dónde va la empresa. En Proyectos abrís cada uno para crear sus Objetivos (con KPI) y sumarles tareas. La rueda muestra el avance.",
    accent: "#7c5cff",
    visual: (r) => <FloatEmoji emoji="🎯" reduce={r} />,
  },
  {
    key: "week-time",
    kicker: "Ejecutá",
    title: "Semana y Tiempos",
    body: "En Semana arrastrás tareas a cada día y elegís responsables. En Tiempos ves cuánto trabajó cada persona. Todo en vivo para el equipo.",
    accent: "#ffb020",
    visual: SectionsVisual,
  },
  {
    key: "team",
    kicker: "En equipo",
    title: "Espacios, roles y novedades",
    body: "Creá espacios de trabajo e invitá gente por email. Los admin planean y gestionan; los empleados enfocan sus tareas. Con “Solo lo mío” ves solo lo tuyo cuando querés.",
    accent: "#ff5c8a",
    visual: (r) => <FloatEmoji emoji="🤝" reduce={r} />,
  },
  {
    key: "go",
    kicker: "¡Listo!",
    title: "Empecemos por un proyecto",
    body: "El primer paso siempre es crear un Proyecto y ponerle un Objetivo. De ahí, las tareas fluyen solas. ¿Arrancamos?",
    accent: "#0057FF",
    visual: (r) => <FloatEmoji emoji="🚀" reduce={r} />,
  },
];

/* ─────────────────────────── Tour ─────────────────────────── */

export function OnboardingTour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);

  const last = SLIDES.length - 1;
  const slide = SLIDES[index];

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next > last) return;
      setState(([cur]) => [next, next > cur ? 1 : -1]);
    },
    [last]
  );

  const finish = useCallback(
    (toProjects: boolean) => {
      onClose();
      setState([0, 0]);
      if (toProjects) router.push("/proyectos");
    },
    [onClose, router]
  );

  useEffect(() => {
    if (!open) return;
    function key(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, index, go, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Fondo con gradiente que cambia por slide */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `radial-gradient(120% 120% at 50% 0%, ${slide.accent}2e 0%, rgba(6,8,16,0.96) 55%, rgba(4,6,12,1) 100%)`,
        }}
        transition={{ duration: 0.6 }}
      />
      <div className="absolute inset-0 backdrop-blur-xl" />

      {/* Cerrar / saltar */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-10 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 font-body text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
      >
        Saltar <X className="h-4 w-4" />
      </button>

      {/* Contenido */}
      <div className="relative z-[1] flex w-full max-w-2xl flex-col items-center gap-8 px-6 text-center">
        <div className="flex min-h-[220px] items-center justify-center">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={slide.key + "-visual"}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
              className="flex items-center justify-center"
            >
              {slide.visual(reduce)}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={slide.key + "-text"}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -60 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
            className="flex flex-col items-center gap-3"
          >
            <span
              className="font-body text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: slide.accent }}
            >
              {slide.kicker}
            </span>
            <h1
              className="font-display text-4xl font-black leading-[1.05] text-white sm:text-5xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              {slide.title}
            </h1>
            <p className="max-w-lg font-body text-base leading-relaxed text-white/70 sm:text-lg">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Puntos de progreso */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`Ir al paso ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === index ? 28 : 8,
                background: i === index ? slide.accent : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-body text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="h-4 w-4" /> Atrás
            </button>
          )}
          {index < last ? (
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="flex items-center gap-1.5 rounded-2xl px-6 py-3 font-body text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,87,255,0.4)] transition-transform hover:scale-[1.03]"
              style={{ background: "var(--brand-gradient)" }}
            >
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => finish(false)}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-body text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Explorar solo
              </button>
              <button
                type="button"
                onClick={() => finish(true)}
                className="flex items-center gap-1.5 rounded-2xl px-6 py-3 font-body text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,87,255,0.4)] transition-transform hover:scale-[1.03]"
                style={{ background: "var(--brand-gradient)" }}
              >
                Crear mi primer proyecto 🚀
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
