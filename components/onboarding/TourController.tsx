"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, ArrowLeft, ArrowRight, Check, MousePointerClick } from "lucide-react";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { SmartGraphic, KpiMockGraphic, PyramidGraphic } from "@/components/onboarding/tourGraphics";

const CARD_W = 400;
const SEEN_KEY = "onboarding-tour-seen"; // lo pone el modal de bienvenida al cerrarse

/** Dispara la guía interactiva a pedido (desde la burbuja). */
export function startGuidedTour() {
  window.dispatchEvent(new Event("start-guided-tour"));
}

type Step = {
  id: string;
  /** context = oscurece y señala (para explicar). action = pantalla clara y usable (el usuario hace). */
  mode: "context" | "action";
  screen: string; // etiqueta de pantalla ("Hoy", "Metas"…) que se muestra en la tarjeta
  anchor?: string; // data-tour a resaltar
  /** Si viene, la guía avanza sola cuando el usuario llega a esa pantalla. */
  advanceOn?: (pathname: string) => boolean;
  kicker: string;
  title: string;
  body: React.ReactNode;
  /** Ejemplo concreto a escribir (se muestra copiable, en modo acción). */
  example?: string;
};

export function TourController({ autoStart, isAdmin }: { autoStart: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogWasOpen = useRef(false);

  // Evita mismatch de hydration: el portal (a document.body) recién se monta en
  // el cliente. En SSR y el primer render de cliente devolvemos null.
  useEffect(() => setMounted(true), []);

  // ── Guion ────────────────────────────────────────────────
  const steps: Step[] = [];
  steps.push({
    id: "welcome",
    mode: "context",
    screen: "Bienvenida",
    kicker: "Guía paso a paso",
    title: "Aprendé haciendo 🙌",
    body: (
      <>
        Te acompaño por el software y <strong>vos vas haciendo</strong> cada paso. Así de verdad
        aprendés a usarlo.
        {isAdmin
          ? " Vamos a crear un ejemplo real (que al final borrás vos mismo)."
          : " Con ejemplos visuales del método."}{" "}
        Cuando quieras, tocá <strong>Saltar</strong>.
      </>
    ),
  });
  steps.push({
    id: "go-hoy",
    mode: "context",
    screen: "Menú",
    anchor: "nav-hoy",
    advanceOn: (p) => p === "/hoy",
    kicker: "Empezá acá",
    title: "Abrí la pantalla Hoy",
    body: <>Hacé clic en <strong>“Hoy”</strong> en el menú de la izquierda. 👈</>,
  });
  steps.push({
    id: "hoy-intro",
    mode: "context",
    screen: "Hoy",
    kicker: "Pantalla Hoy",
    title: "Esta es tu pantalla del día",
    body: (
      <>
        Acá vas a ver <strong>solo tus tareas de hoy</strong>. Ahora está vacía porque todavía no
        armaste el plan. El plan se arma <strong>de arriba hacia abajo</strong>: Metas → Proyectos →
        Objetivos → Tareas. Vamos a la primera: las Metas.
      </>
    ),
  });

  if (isAdmin) {
    steps.push({
      id: "go-metas",
      mode: "context",
      screen: "Menú",
      anchor: "nav-metas",
      advanceOn: (p) => p === "/metas",
      kicker: "1 · Metas",
      title: "Andá a Metas",
      body: <>Hacé clic en <strong>“Metas”</strong> en el menú. 👈</>,
    });
    steps.push({
      id: "create-meta",
      mode: "action",
      screen: "Metas",
      anchor: "metas-new",
      kicker: "1 · Metas",
      title: "Creá tu primera meta (SMART)",
      body: (
        <div className="flex flex-col gap-2">
          <span>
            Tocá <strong>“Nueva meta”</strong> y escribila. Que sea <strong>SMART</strong>:
          </span>
          <SmartGraphic />
          <span className="text-fg-muted">Cuando la tengas, tocá “Siguiente”.</span>
        </div>
      ),
      example: "Ejemplo: Llegar a 20 clientes activos para diciembre · KPI: 20 clientes",
    });
    steps.push({
      id: "go-proyectos",
      mode: "context",
      screen: "Menú",
      anchor: "nav-proyectos",
      advanceOn: (p) => p === "/proyectos",
      kicker: "2 · Proyectos",
      title: "Ahora andá a Proyectos",
      body: <>Hacé clic en <strong>“Proyectos”</strong> en el menú. 👈</>,
    });
    steps.push({
      id: "create-proyecto",
      mode: "action",
      screen: "Proyectos",
      anchor: "proyectos-new",
      kicker: "2 · Proyectos",
      title: "Creá un proyecto y ligalo a la meta",
      body: (
        <>
          Tocá <strong>“Nuevo proyecto”</strong>, ponele nombre y elegí que <strong>aporte a tu meta</strong>.
          Un proyecto es un bloque grande de trabajo que te acerca a esa meta.
        </>
      ),
      example: "Ejemplo: Campaña de lanzamiento",
    });
    steps.push({
      id: "open-proyecto",
      mode: "context",
      screen: "Proyectos",
      anchor: "proyectos-list",
      advanceOn: (p) => p.startsWith("/proyectos/"),
      kicker: "3 · Objetivos",
      title: "Abrí tu proyecto",
      body: <>Hacé clic en la <strong>tarjeta del proyecto</strong> que creaste para entrar. 👆</>,
    });
    steps.push({
      id: "create-objetivo",
      mode: "action",
      screen: "Proyecto",
      anchor: "obj-add",
      kicker: "3 · Objetivos",
      title: "Agregá un objetivo medible",
      body: (
        <div className="flex flex-col gap-2">
          <span>
            Tocá <strong>“Objetivo”</strong>. Ponele nombre, y un <strong>KPI</strong> con número (meta + unidad):
          </span>
          <KpiMockGraphic />
        </div>
      ),
      example: "Objetivo: Publicar 8 reels · KPI: Reels · Meta: 8 · Unidad: reels",
    });
    steps.push({
      id: "kpi-explain",
      mode: "context",
      screen: "Proyecto",
      anchor: "obj-kpi",
      kicker: "4 · KPIs",
      title: "El KPI mide tu avance",
      body: (
        <>
          Ese número con meta es tu KPI. Cuando avances, hacés <strong>clic en el valor</strong> y lo
          actualizás. Así ves cuánto te falta, sin adivinar.
        </>
      ),
    });
    steps.push({
      id: "create-tarea",
      mode: "action",
      screen: "Proyecto",
      anchor: "obj-task",
      kicker: "5 · Tareas",
      title: "Sumá una tarea al objetivo",
      body: (
        <>
          Escribí una tarea en el objetivo y apretá Enter. Cada tarea <strong>cuelga de un objetivo</strong>,
          así nunca trabajás en algo que no te acerca a la meta.
        </>
      ),
      example: "Tarea: Grabar el primer reel",
    });
  } else {
    steps.push({
      id: "metodo",
      mode: "context",
      screen: "El método",
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
    mode: "context",
    screen: "El método",
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
    mode: "context",
    screen: "Menú",
    anchor: "nav-semana",
    advanceOn: (p) => p === "/semana",
    kicker: "Planear",
    title: "Andá a Semana",
    body: <>Hacé clic en <strong>“Semana”</strong> en el menú. 👈</>,
  });
  steps.push({
    id: "semana",
    mode: "action",
    screen: "Semana",
    anchor: "semana-backlog",
    kicker: "Planear",
    title: "Planeá tu semana",
    body: (
      <>
        Abrí el <strong>Backlog</strong> y <strong>arrastrá</strong> una tarea a un día para agendarla.
        Con el selector de arriba elegís qué ver (solo tuyas, del equipo o de varios espacios).
      </>
    ),
  });
  steps.push({
    id: "go-hoy2",
    mode: "context",
    screen: "Menú",
    anchor: "nav-hoy",
    advanceOn: (p) => p === "/hoy",
    kicker: "Cada día",
    title: "Volvé a Hoy",
    body: <>Hacé clic en <strong>“Hoy”</strong>. Cada mañana empezás acá. 👈</>,
  });
  steps.push({
    id: "cronometro",
    mode: "context",
    screen: "Hoy",
    anchor: "cronometro",
    kicker: "Registrar",
    title: "El cronómetro",
    body: <>Al empezar a trabajar, prendé el cronómetro. Registra cuánto tiempo le dedicás a cada cosa.</>,
  });
  steps.push({
    id: "go-novedades",
    mode: "context",
    screen: "Menú",
    anchor: "nav-novedades",
    advanceOn: (p) => p === "/novedades",
    kicker: "Cierre del día",
    title: "Andá a Novedades",
    body: <>Hacé clic en <strong>“Novedades”</strong> en el menú. 👈</>,
  });
  steps.push({
    id: "novedades",
    mode: "context",
    screen: "Novedades",
    anchor: "novedades-form",
    kicker: "Cierre del día",
    title: "El hábito clave, todos los días",
    body: (
      <>
        Al terminar el día: escribí tus <strong>avances</strong>, <strong>problemas</strong> y{" "}
        <strong>próximos pasos</strong>, y ahí mismo <strong>pará el cronómetro</strong>. Así el equipo
        queda siempre alineado.
      </>
    ),
  });

  if (isAdmin) {
    steps.push({
      id: "go-proyectos-clean",
      mode: "context",
      screen: "Menú",
      anchor: "nav-proyectos",
      advanceOn: (p) => p === "/proyectos",
      kicker: "Limpieza",
      title: "Volvé a Proyectos",
      body: <>Hacé clic en <strong>“Proyectos”</strong> para borrar el ejemplo. 👈</>,
    });
    steps.push({
      id: "cleanup",
      mode: "action",
      screen: "Proyectos",
      anchor: "proyecto-archivar",
      kicker: "Limpieza",
      title: "Borrá el proyecto de ejemplo",
      body: (
        <>
          Tocá la <strong>✕</strong> de la tarjeta del proyecto de ejemplo y confirmá. Se archiva el
          proyecto <strong>con su objetivo y tareas</strong>. Así aprendés también a borrar.
        </>
      ),
    });
  }

  steps.push({
    id: "cierre",
    mode: "context",
    screen: "¡Listo!",
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

  // ── Avanzar solo cuando el usuario llega a la pantalla pedida ──
  useEffect(() => {
    if (!active || !step.advanceOn) return;
    if (step.advanceOn(pathname)) setStepIndex((i) => Math.min(i + 1, steps.length - 1));
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

  // ── Detectar diálogo abierto (para no taparlo) + auto-avanzar al cerrarlo ──
  // Si en un paso de acción el usuario abre y cierra un diálogo (crear proyecto,
  // confirmar borrado…), avanzamos solos: ya hizo la acción, no repetimos la
  // instrucción.
  useEffect(() => {
    if (!active || step.mode !== "action") {
      setDialogOpen(false);
      dialogWasOpen.current = false;
      return;
    }
    dialogWasOpen.current = false;
    const check = () => {
      const open = !!document.querySelector(
        '[data-slot="dialog-content"], [role="dialog"], [role="alertdialog"]'
      );
      setDialogOpen(open);
      if (open) {
        dialogWasOpen.current = true;
      } else if (dialogWasOpen.current) {
        dialogWasOpen.current = false;
        setStepIndex((i) => Math.min(i + 1, steps.length - 1));
      }
    };
    check();
    const t = setInterval(check, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  const finish = useCallback(async () => {
    setActive(false);
    setStepIndex(0);
    await completeOnboardingAction();
  }, []);

  function next() {
    if (isLast) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
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

  const isAction = step.mode === "action";
  // El usuario debe poder interactuar con la pantalla cuando tiene que hacer algo
  // (acción) o navegar (advanceOn). En pasos de pura lectura, se bloquea el fondo.
  const interactive = isAction || !!step.advanceOn;

  // ── Posición de la tarjeta ──
  let cardStyle: React.CSSProperties;
  if (isAction) {
    // Modo acción: tarjeta en la esquina inferior derecha; pantalla libre y usable.
    cardStyle = { position: "fixed", bottom: 20, right: 20, width: CARD_W };
  } else if (rect) {
    const spaceBelow = window.innerHeight - rect.bottom;
    const below = spaceBelow > 300 || spaceBelow > rect.top;
    let left = rect.left + rect.width / 2 - CARD_W / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - CARD_W - 12));
    cardStyle = below
      ? { position: "fixed", top: rect.bottom + 16, left, width: CARD_W }
      : { position: "fixed", top: rect.top - 16, left, width: CARD_W, transform: "translateY(-100%)" };
  } else {
    cardStyle = { position: "fixed", top: "50%", left: "50%", width: CARD_W, transform: "translate(-50%, -50%)" };
  }

  // Con un diálogo abierto: barra fina arriba (no tapa el diálogo centrado).
  if (isAction && dialogOpen) {
    return createPortal(
      <div className="fixed inset-x-0 top-0 z-[1000] flex justify-center px-3 pt-3" style={{ pointerEvents: "none" }}>
        <div
          style={{ pointerEvents: "auto" }}
          className="flex w-full max-w-2xl flex-col gap-1.5 rounded-2xl border border-[var(--glass-border)] bg-elevated px-4 py-3 shadow-[var(--shadow-2)]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-accent-cyan" />
            <span className="font-body text-sm font-bold text-fg">{step.title}</span>
            <button type="button" onClick={finish} aria-label="Saltar" className="ml-auto text-fg-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
          {step.example && (
            <div className="flex items-center gap-2">
              <span className="shrink-0 font-body text-[10px] font-bold uppercase tracking-wide text-accent-mint">
                Escribí
              </span>
              <span className="truncate font-body text-sm text-fg">{step.example}</span>
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-0.5">
            <button type="button" onClick={finish} className="rounded-lg px-2.5 py-1.5 font-body text-xs text-fg-muted hover:text-fg">
              Saltar guía
            </button>
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-body text-sm font-bold text-white"
              style={{ background: "var(--brand-gradient, #0057FF)" }}
            >
              Siguiente <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>,
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
        outlineOffset: 0,
        boxShadow: isAction ? "0 0 0 4px rgba(12,192,223,0.25)" : "0 0 0 9999px rgba(0,0,0,0.66)",
        pointerEvents: "none",
        transition: "all 200ms ease",
      }}
    />
  ) : null;

  return createPortal(
    // En modo acción el contenedor NO bloquea la pantalla (pointer-events none);
    // solo la tarjeta es interactiva. En contexto sí bloquea (para leer).
    <div className="fixed inset-0 z-[900]" style={{ pointerEvents: interactive ? "none" : "auto" }}>
      {/* Oscurecido / resaltado */}
      {!isAction && !rect && <div className="fixed inset-0 bg-black/70" />}
      {ring}

      {/* Tarjeta */}
      <div
        style={{ ...cardStyle, pointerEvents: "auto" }}
        className="max-w-[calc(100vw-24px)] rounded-3xl border border-[var(--glass-border)] bg-elevated p-5 shadow-[var(--shadow-2)]"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-accent-cyan">
            <Sparkles className="h-3.5 w-3.5" /> {step.kicker}
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-white/8 px-2 py-0.5 font-body text-[10px] font-semibold text-fg-muted">
              {step.screen}
            </span>
            <button type="button" onClick={finish} aria-label="Saltar guía" className="text-fg-muted transition-colors hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </span>
        </div>

        <h3 className="mt-1.5 font-display text-xl font-black leading-tight tracking-[-0.01em] text-fg">
          {step.title}
        </h3>
        <div className="mt-2 font-body text-sm leading-relaxed text-fg-secondary">{step.body}</div>

        {step.example && (
          <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-dashed border-[var(--border-active)] bg-white/[0.04] px-3 py-2">
            <span className="mt-0.5 font-body text-[10px] font-bold uppercase tracking-wide text-accent-mint">
              Escribí
            </span>
            <span className="font-body text-sm text-fg">{step.example}</span>
          </div>
        )}

        {isAction && (
          <p className="mt-2 flex items-center gap-1.5 font-body text-[11px] text-fg-muted">
            <MousePointerClick className="h-3.5 w-3.5" /> Hacelo vos en la pantalla; cuando termines, tocá Siguiente.
          </p>
        )}

        {/* Progreso */}
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
              onClick={next}
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
