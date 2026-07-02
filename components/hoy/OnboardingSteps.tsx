"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const DISMISS_KEY = "onboarding-hidden";

/**
 * Guía suave de 3 pasos para el primer uso (cuando aún no hay proyectos).
 * Se puede descartar; se recuerda en localStorage.
 */
export function OnboardingSteps() {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (hidden) return null;

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setHidden(true);
  }

  const steps = [
    { n: 1, icon: "📁", title: "Creá un proyecto", hint: "Lo grande en lo que trabajás." },
    { n: 2, icon: "🎯", title: "Ponele objetivos", hint: "Con su KPI: cómo se mide el éxito." },
    { n: 3, icon: "✅", title: "Sumá tareas", hint: "Las acciones que llevan a cada objetivo." },
  ];

  return (
    <div className="relative flex flex-col gap-4 rounded-[24px] border border-[var(--glass-border)] bg-white/5 p-5">
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ocultar guía"
        className="absolute right-4 top-4 text-fg-disabled transition-colors hover:text-fg"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-accent-cyan">
          Bienvenido 👋
        </span>
        <h2 className="font-primary text-xl font-bold text-fg">
          Organizá en 3 pasos, de arriba hacia abajo
        </h2>
        <p className="font-body text-sm text-fg-muted">
          Antes de las tareas, definí a dónde querés llegar. Así cada tarea tiene sentido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="flex flex-col gap-1 rounded-[18px] bg-white/5 p-4">
            <span className="text-2xl">{s.icon}</span>
            <span className="font-body text-sm font-semibold text-fg">
              {s.n}. {s.title}
            </span>
            <span className="font-body text-xs text-fg-muted">{s.hint}</span>
          </div>
        ))}
      </div>

      <Link
        href="/proyectos"
        className="flex w-fit items-center gap-2 rounded-2xl px-4 py-2.5 font-body text-sm font-bold text-white"
        style={{ background: "var(--brand-gradient)" }}
      >
        Empezar por un proyecto →
      </Link>
    </div>
  );
}
