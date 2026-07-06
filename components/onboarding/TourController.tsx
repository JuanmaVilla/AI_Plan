"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Sparkles, X, ArrowLeft, ArrowRight, Check, MousePointerClick, Hand } from "lucide-react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { SmartGraphic, KpiMockGraphic, PyramidGraphic } from "@/components/onboarding/tourGraphics";

const SEEN_KEY = "onboarding-tour-seen"; // lo pone el modal de bienvenida al cerrarse

/** Dispara la guía interactiva a pedido (desde la burbuja). */
export function startGuidedTour() {
  window.dispatchEvent(new Event("start-guided-tour"));
}

type Step = {
  id: string;
  /**
   * read  = explicar (oscurece + card centrada, con "Siguiente").
   * nav   = ir a una pantalla (resalta el menú; avanza al navegar; SIN "Siguiente").
   * create= crear algo (avanza cuando aparece la tarjeta; SIN "Siguiente").
   * delete= borrar algo (avanza cuando desaparece; SIN "Siguiente").
   * drag  = arrastrar (no detectable; mantiene "Siguiente" manual).
   */
  kind: "read" | "nav" | "create" | "delete" | "drag";
  anchor?: string; // data-tour a resaltar
  advanceOn?: (pathname: string) => boolean; // pasos nav
  /** Selector a contar para create/delete. */
  countSelector?: string;
  kicker: string;
  title: string;
  body: React.ReactNode;
  example?: string; // ejemplo concreto a escribir
};

export function TourController({ autoStart, isAdmin }: { autoStart: boolean; isAdmin: boolean }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => setMounted(true), []);

  // ── Guion ────────────────────────────────────────────────
  const steps: Step[] = [];
  steps.push({
    id: "welcome",
    kind: "read",
    kicker: "Guía paso a paso",
    title: "Aprendé haciendo 🙌",
    body: (
      <>
        Te acompaño por el software y <strong>vos vas haciendo</strong> cada paso: cuando te pido que
        entres a una pantalla o crees algo, la guía avanza <strong>sola al hacerlo</strong>.
        {isAdmin
          ? " Vamos a crear un ejemplo real (que al final borrás vos mismo)."
          : " Con ejemplos visuales del método."}{" "}
        Podés <strong>Saltar</strong> cuando quieras.
      </>
    ),
  });
  steps.push({
    id: "go-hoy",
    kind: "nav",
    anchor: "nav-hoy",
    advanceOn: (p) => p === "/hoy",
    kicker: "Empezá acá",
    title: "Abrí la pantalla Hoy",
    body: <>Hacé clic en <strong>“Hoy”</strong> en el menú de la izquierda. 👈</>,
  });
  steps.push({
    id: "hoy-intro",
    kind: "read",
    kicker: "Pantalla Hoy",
    title: "Esta es tu pantalla del día",
    body: (
      <>
        Acá vas a ver <strong>solo tus tareas de hoy</strong>. Ahora está vacía porque falta el plan.
        El plan se arma <strong>de arriba hacia abajo</strong>: Metas → Proyectos → Objetivos →
        Tareas. Empecemos por las Metas.
      </>
    ),
  });

  if (isAdmin) {
    steps.push({
      id: "metas-explain",
      kind: "read",
      kicker: "1 · Metas",
      title: "Metas SMART, con un KPI",
      body: (
        <div className="flex flex-col gap-2">
          <span>Las metas son el norte de la empresa. Que sean <strong>SMART</strong>:</span>
          <SmartGraphic />
        </div>
      ),
    });
    steps.push({
      id: "go-metas",
      kind: "nav",
      anchor: "nav-metas",
      advanceOn: (p) => p === "/metas",
      kicker: "1 · Metas",
      title: "Andá a Metas",
      body: <>Hacé clic en <strong>“Metas”</strong> en el menú. 👈</>,
    });
    steps.push({
      id: "create-meta",
      kind: "create",
      anchor: "metas-new",
      countSelector: '[data-tour="meta-card"]',
      kicker: "1 · Metas",
      title: "Creá tu primera meta",
      body: (
        <>
          Tocá <strong>“Nueva meta”</strong> y escribila (que sea SMART). Cuando la crees, la guía
          sigue sola.
        </>
      ),
      example: "Llegar a 20 clientes activos para diciembre · KPI: 20 clientes",
    });
    steps.push({
      id: "proyectos-explain",
      kind: "read",
      kicker: "2 · Proyectos",
      title: "Proyectos que aportan a la meta",
      body: (
        <>
          Un proyecto es un bloque grande de trabajo que te acerca a una meta. Vas a crear uno y
          ligarlo a la meta que hiciste.
        </>
      ),
    });
    steps.push({
      id: "go-proyectos",
      kind: "nav",
      anchor: "nav-proyectos",
      advanceOn: (p) => p === "/proyectos",
      kicker: "2 · Proyectos",
      title: "Andá a Proyectos",
      body: <>Hacé clic en <strong>“Proyectos”</strong> en el menú. 👈</>,
    });
    steps.push({
      id: "create-proyecto",
      kind: "create",
      anchor: "proyectos-new",
      countSelector: '[data-tour="project-card"]',
      kicker: "2 · Proyectos",
      title: "Creá un proyecto",
      body: (
        <>
          Tocá <strong>“Nuevo proyecto”</strong>, ponele nombre y elegí que <strong>aporte a tu meta</strong>.
          Al crearlo, seguimos.
        </>
      ),
      example: "Campaña de lanzamiento",
    });
    steps.push({
      id: "open-proyecto",
      kind: "nav",
      anchor: "proyectos-list",
      advanceOn: (p) => p.startsWith("/proyectos/"),
      kicker: "3 · Objetivos",
      title: "Abrí tu proyecto",
      body: <>Hacé clic en la <strong>tarjeta del proyecto</strong> que creaste para entrar. 👆</>,
    });
    steps.push({
      id: "objetivo-explain",
      kind: "read",
      kicker: "3 · Objetivos",
      title: "Objetivos medibles (con KPI)",
      body: (
        <div className="flex flex-col gap-2">
          <span>
            Dentro del proyecto van objetivos <strong>medibles</strong>. Cada uno con un{" "}
            <strong>KPI</strong> (número + meta):
          </span>
          <KpiMockGraphic />
        </div>
      ),
    });
    steps.push({
      id: "create-objetivo",
      kind: "create",
      anchor: "obj-add",
      countSelector: '[data-tour="objective-card"]',
      kicker: "3 · Objetivos",
      title: "Agregá un objetivo",
      body: (
        <>
          Tocá <strong>“Objetivo”</strong>. Ponele nombre y un KPI con número (meta + unidad). Al
          crearlo, seguimos.
        </>
      ),
      example: "Publicar 8 reels · KPI: Reels · Meta: 8 · Unidad: reels",
    });
    steps.push({
      id: "kpi-explain",
      kind: "read",
      anchor: "obj-kpi",
      kicker: "4 · KPIs",
      title: "El KPI mide tu avance",
      body: (
        <>
          Ese número con meta es tu KPI. Cuando avances, hacés <strong>clic en el valor</strong> y lo
          actualizás. Ves cuánto te falta sin adivinar.
        </>
      ),
    });
    steps.push({
      id: "create-tarea",
      kind: "create",
      anchor: "obj-task",
      countSelector: '[data-tour="obj-task-row"]',
      kicker: "5 · Tareas",
      title: "Sumá una tarea al objetivo",
      body: (
        <>
          Escribí una tarea en el objetivo y apretá Enter. Cada tarea <strong>cuelga de un objetivo</strong>.
          Al agregarla, seguimos.
        </>
      ),
      example: "Grabar el primer reel",
    });
  } else {
    steps.push({
      id: "metodo",
      kind: "read",
      kicker: "Cómo funciona",
      title: "Metas → Proyectos → Objetivos → Tareas",
      body: (
        <div className="flex flex-col gap-2">
          <span>Tu admin define metas y proyectos con objetivos medibles (SMART + KPI):</span>
          <SmartGraphic />
          <KpiMockGraphic />
        </div>
      ),
    });
  }

  steps.push({
    id: "alineacion",
    kind: "read",
    kicker: "Por qué funciona",
    title: "Todo se alinea",
    body: (
      <div className="flex flex-col gap-2">
        <span>El corazón del software: nada queda suelto.</span>
        <PyramidGraphic />
      </div>
    ),
  });
  steps.push({
    id: "go-semana",
    kind: "nav",
    anchor: "nav-semana",
    advanceOn: (p) => p === "/semana",
    kicker: "Planear",
    title: "Andá a Semana",
    body: <>Hacé clic en <strong>“Semana”</strong> en el menú. 👈</>,
  });
  steps.push({
    id: "semana",
    kind: "drag",
    anchor: "semana-backlog",
    kicker: "Planear",
    title: "Planeá tu semana",
    body: (
      <>
        Abrí el <strong>Backlog</strong> y <strong>arrastrá</strong> una tarea a un día para agendarla.
        Cuando termines, tocá Siguiente.
      </>
    ),
  });
  steps.push({
    id: "go-hoy2",
    kind: "nav",
    anchor: "nav-hoy",
    advanceOn: (p) => p === "/hoy",
    kicker: "Cada día",
    title: "Volvé a Hoy",
    body: <>Hacé clic en <strong>“Hoy”</strong>. Cada mañana empezás acá. 👈</>,
  });
  steps.push({
    id: "cronometro",
    kind: "read",
    anchor: "cronometro",
    kicker: "Registrar",
    title: "El cronómetro",
    body: <>Al empezar a trabajar, prendé el cronómetro. Registra cuánto tiempo le dedicás a cada cosa.</>,
  });
  steps.push({
    id: "go-novedades",
    kind: "nav",
    anchor: "nav-novedades",
    advanceOn: (p) => p === "/novedades",
    kicker: "Cierre del día",
    title: "Andá a Novedades",
    body: <>Hacé clic en <strong>“Novedades”</strong> en el menú. 👈</>,
  });
  steps.push({
    id: "novedades",
    kind: "read",
    anchor: "novedades-form",
    kicker: "Cierre del día",
    title: "El hábito clave, todos los días",
    body: (
      <>
        Al terminar el día: escribí tus <strong>avances</strong>, <strong>problemas</strong> y{" "}
        <strong>próximos pasos</strong>, y ahí mismo <strong>pará el cronómetro</strong>.
      </>
    ),
  });

  if (isAdmin) {
    steps.push({
      id: "go-proyectos-clean",
      kind: "nav",
      anchor: "nav-proyectos",
      advanceOn: (p) => p === "/proyectos",
      kicker: "Limpieza",
      title: "Volvé a Proyectos",
      body: <>Hacé clic en <strong>“Proyectos”</strong> para borrar el ejemplo. 👈</>,
    });
    steps.push({
      id: "cleanup",
      kind: "delete",
      anchor: "proyecto-archivar",
      countSelector: '[data-tour="project-card"]',
      kicker: "Limpieza",
      title: "Borrá el proyecto de ejemplo",
      body: (
        <>
          Tocá la <strong>✕</strong> de la tarjeta del proyecto y confirmá. Se borra el proyecto{" "}
          <strong>con su objetivo y tareas</strong>. Al borrarlo, seguimos.
        </>
      ),
    });
  }

  steps.push({
    id: "cierre",
    kind: "read",
    kicker: "¡Terminaste!",
    title: "Ya sabés el ciclo completo",
    body: (
      <div className="flex flex-col gap-2">
        <PyramidGraphic />
        <span>
          Metas → Proyectos → Objetivos → Tareas → Semana → Hoy → Cronómetro → Novedades. Repetí esta
          guía cuando quieras desde la burbuja ✨.
        </span>
      </div>
    ),
  });

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLast = stepIndex >= steps.length - 1;
  const isRead = step.kind === "read";
  // read = card centrada que bloquea (lectura). El resto = barra arriba, pantalla usable.
  const banner = !isRead;

  // ── Arranque automático (tras cerrar el modal de bienvenida) ──
  useEffect(() => {
    if (!autoStart) return;
    if (localStorage.getItem(SEEN_KEY) === "1") {
      setActive(true);
      return;
    }
    const t = setInterval(() => {
      if (localStorage.getItem(SEEN_KEY) === "1") {
        clearInterval(t);
        setActive(true);
      }
    }, 800);
    return () => clearInterval(t);
  }, [autoStart]);

  // ── Arranque manual (burbuja) ──
  useEffect(() => {
    function onStart() {
      setStepIndex(0);
      setActive(true);
    }
    window.addEventListener("start-guided-tour", onStart);
    return () => window.removeEventListener("start-guided-tour", onStart);
  }, []);

  const advance = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [steps.length]);

  // ── Avanzar en pasos nav cuando el usuario llega a la pantalla ──
  useEffect(() => {
    if (!active || step.kind !== "nav" || !step.advanceOn) return;
    if (step.advanceOn(pathname)) advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, pathname]);

  // ── Ubicar el ancla ──
  useEffect(() => {
    if (!active || !step.anchor) {
      setRect(null);
      return;
    }
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      const el = document.querySelector(`[data-tour="${step.anchor}"]`) as HTMLElement | null;
      if (el) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        setTimeout(() => {
          if (!cancelled) setRect(el.getBoundingClientRect());
        }, 260);
        return;
      }
      if (tries++ < 30) setTimeout(tick, 100);
      else setRect(null);
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex, pathname]);

  // ── Reposicionar en scroll/resize ──
  useEffect(() => {
    if (!active || !step.anchor) return;
    function reposition() {
      const el = document.querySelector(`[data-tour="${step.anchor}"]`) as HTMLElement | null;
      if (el) setRect(el.getBoundingClientRect());
    }
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  const finish = useCallback(async () => {
    setActive(false);
    setStepIndex(0);
    await completeOnboardingAction();
  }, []);

  function nextManual() {
    if (isLast) {
      finish();
      return;
    }
    advance();
  }

  if (!mounted || typeof document === "undefined") return null;

  // Inactiva → burbuja discreta para (re)lanzar la guía (abajo izquierda).
  if (!active) {
    return createPortal(
      <button
        type="button"
        onClick={() => {
          setStepIndex(0);
          setActive(true);
        }}
        title="Guía paso a paso"
        className="fixed bottom-5 left-5 z-[850] hidden items-center gap-2 rounded-full border border-[var(--glass-border)] bg-elevated px-3.5 py-2.5 font-body text-sm font-semibold text-fg-secondary shadow-[var(--shadow-2)] transition-colors hover:text-fg md:flex"
      >
        <Sparkles className="h-4 w-4 text-accent-cyan" /> Guía
      </button>,
      document.body
    );
  }

  const ring = rect ? (
    <div
      style={{
        position: "fixed",
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: 14,
        outline: "3px solid var(--accent-cyan, #0cc0df)",
        boxShadow: isRead ? "0 0 0 9999px rgba(0,0,0,0.66)" : "0 0 0 4px rgba(12,192,223,0.25)",
        pointerEvents: "none",
        transition: "all 200ms ease",
      }}
    />
  ) : null;

  // ── BARRA SUPERIOR (nav / create / delete / drag): pantalla usable ──
  if (banner) {
    return createPortal(
      <div className="fixed inset-0 z-[900]" style={{ pointerEvents: "none" }}>
        {ring}
        <div className="fixed inset-x-0 top-0 flex justify-center px-3 pt-3">
          <div
            style={{ pointerEvents: "auto" }}
            className="flex w-full max-w-2xl flex-col gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-elevated px-4 py-3 shadow-[var(--shadow-2)]"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-accent-cyan" />
              <span className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-accent-cyan">
                {step.kicker}
              </span>
              <button type="button" onClick={finish} aria-label="Saltar guía" className="ml-auto text-fg-muted hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <span className="font-display text-lg font-black leading-tight text-fg">{step.title}</span>
            <div className="font-body text-sm leading-snug text-fg-secondary">{step.body}</div>
            {step.example && (
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-[var(--border-active)] bg-white/[0.04] px-3 py-2">
                <span className="mt-0.5 shrink-0 font-body text-[10px] font-bold uppercase tracking-wide text-accent-mint">
                  Escribí
                </span>
                <span className="font-body text-sm text-fg">{step.example}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="flex items-center gap-1.5 font-body text-[11px] text-fg-muted">
                {step.kind === "nav" ? (
                  <><MousePointerClick className="h-3.5 w-3.5" /> La guía sigue sola al hacer clic</>
                ) : (
                  <><Hand className="h-3.5 w-3.5" /> Hacelo; después tocá Siguiente</>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={finish} className="rounded-lg px-2.5 py-1.5 font-body text-xs text-fg-muted hover:text-fg">
                  Saltar guía
                </button>
                {step.kind !== "nav" && (
                  <button
                    type="button"
                    onClick={nextManual}
                    className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-body text-sm font-bold text-white"
                    style={{ background: "var(--brand-gradient, #0057FF)" }}
                  >
                    {isLast ? "Terminar" : "Siguiente"} <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // ── CARD CENTRADA (read): explicación con gráfico, bloquea el fondo ──
  return createPortal(
    <div className="fixed inset-0 z-[900]" style={{ pointerEvents: "auto" }}>
      {rect ? ring : <div className="fixed inset-0 bg-black/70" />}
      <div
        style={{ position: "fixed", top: "50%", left: "50%", width: 400, transform: "translate(-50%, -50%)" }}
        className="max-h-[85vh] max-w-[calc(100vw-24px)] overflow-y-auto rounded-3xl border border-[var(--glass-border)] bg-elevated p-5 shadow-[var(--shadow-2)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-accent-cyan">
            <Sparkles className="h-3.5 w-3.5" /> {step.kicker}
          </span>
          <button type="button" onClick={finish} aria-label="Saltar guía" className="text-fg-muted transition-colors hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>

        <h3 className="mt-1.5 font-display text-xl font-black leading-tight tracking-[-0.01em] text-fg">
          {step.title}
        </h3>
        <div className="mt-2 font-body text-sm leading-relaxed text-fg-secondary">{step.body}</div>

        <div className="mt-4 flex items-center gap-1">
          {steps.map((s, i) => (
            <span key={s.id} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? "bg-accent-cyan" : "bg-white/12"}`} />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
            disabled={stepIndex === 0}
            className="flex items-center gap-1 rounded-xl px-2.5 py-2 font-body text-sm font-semibold text-fg-muted transition-colors hover:text-fg disabled:opacity-0"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={finish} className="rounded-xl px-3 py-2 font-body text-sm text-fg-muted transition-colors hover:text-fg">
              Saltar
            </button>
            <button
              type="button"
              onClick={nextManual}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 font-body text-sm font-bold text-white shadow-[0_6px_20px_rgba(0,87,255,0.4)]"
              style={{ background: "var(--brand-gradient, #0057FF)" }}
            >
              {isLast ? "Terminar" : "Siguiente"}
              {isLast ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
