"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { createNewsAction } from "@/app/(app)/novedades/actions";
import type { PickProject } from "@/lib/actions/tasks";
import { todayISO } from "@/lib/dates";

const STEPS = [
  { key: "project", label: "¿En qué proyecto trabajaste hoy?", optional: true },
  { key: "advances", label: "¿Qué avanzaste?", optional: false },
  { key: "problem", label: "¿Hubo algún problema o bloqueo?", optional: true },
  { key: "next_steps", label: "¿Cuáles son los próximos pasos?", optional: true },
] as const;

export function NewsForm({ projects }: { projects: PickProject[] }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState<string>("");
  const [advances, setAdvances] = useState<string[]>([""]);
  const [problem, setProblem] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setStep(0);
    setProjectId("");
    setAdvances([""]);
    setProblem("");
    setNextSteps("");
    setError("");
    setOpen(false);
  }

  function addAdvance() {
    setAdvances((a) => [...a, ""]);
  }

  function setAdvanceAt(i: number, val: string) {
    setAdvances((a) => a.map((v, idx) => (idx === i ? val : v)));
  }

  function removeAdvance(i: number) {
    setAdvances((a) => a.filter((_, idx) => idx !== i));
  }

  function canNext() {
    if (step === 1) return advances.some((a) => a.trim());
    return true;
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await createNewsAction({ projectId, advances, problem, nextSteps });
      if (res.ok) {
        reset();
      } else {
        setError(res.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-[20px] border border-dashed border-[var(--border-default)] px-5 py-4 text-left transition-colors hover:border-[var(--border-active)]"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-fg-muted">
          <Plus className="h-4 w-4" />
        </span>
        <div>
          <p className="font-body text-sm font-semibold text-fg">Nueva novedad</p>
          <p className="font-body text-xs text-fg-muted">Contale al equipo qué pasó hoy</p>
        </div>
      </button>
    );
  }

  const currentStep = STEPS[step];

  return (
    <div className="glass-card rounded-[26px] p-5">
      {/* Progress dots */}
      <div className="mb-5 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < step
                ? "bg-accent-cyan"
                : i === step
                ? "bg-accent-cyan/60"
                : "bg-[var(--border-default)]"
            }`}
          />
        ))}
      </div>

      <p className="mb-1 font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
        Paso {step + 1} de {STEPS.length}
        {currentStep.optional && " · Opcional"}
      </p>
      <p className="mb-4 font-primary text-base font-bold text-fg">{currentStep.label}</p>

      {/* Step 0: Proyecto */}
      {step === 0 && (
        <div className="flex flex-col gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-[var(--border-default)] bg-surface px-3 py-2.5 font-body text-sm text-fg focus:border-[var(--border-active)] focus:outline-none"
          >
            <option value="">Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.icon} {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Step 1: Avances */}
      {step === 1 && (
        <div className="flex flex-col gap-2">
          {advances.map((adv, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-cyan" />
              <textarea
                autoFocus={i === advances.length - 1}
                value={adv}
                onChange={(e) => setAdvanceAt(i, e.target.value)}
                placeholder={`Avance ${i + 1}…`}
                rows={1}
                className="flex-1 resize-none rounded-xl border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-sm text-fg placeholder:text-fg-disabled focus:border-[var(--border-active)] focus:outline-none"
              />
              {advances.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAdvance(i)}
                  className="mt-1.5 text-fg-disabled hover:text-[var(--color-error)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addAdvance}
            className="flex items-center gap-1.5 self-start rounded-lg border border-[var(--border-default)] px-3 py-1.5 font-body text-xs text-fg-muted hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" />
            Otro avance
          </button>
        </div>
      )}

      {/* Step 2: Problema */}
      {step === 2 && (
        <textarea
          autoFocus
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Ej: El servidor de staging estuvo caído 2 horas…"
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-surface px-3 py-2.5 font-body text-sm text-fg placeholder:text-fg-disabled focus:border-[var(--border-active)] focus:outline-none"
        />
      )}

      {/* Step 3: Próximos pasos */}
      {step === 3 && (
        <textarea
          autoFocus
          value={nextSteps}
          onChange={(e) => setNextSteps(e.target.value)}
          placeholder="Ej: Terminar el componente de pago y hacer deploy…"
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--border-default)] bg-surface px-3 py-2.5 font-body text-sm text-fg placeholder:text-fg-disabled focus:border-[var(--border-active)] focus:outline-none"
        />
      )}

      {error && <p className="mt-2 font-body text-sm text-[var(--color-error)]">{error}</p>}

      {/* Nav buttons */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={step === 0 ? reset : () => setStep((s) => s - 1)}
          className="font-body text-sm text-fg-muted hover:text-fg"
        >
          {step === 0 ? "Cancelar" : "← Atrás"}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="rounded-xl px-5 py-2.5 font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,87,255,0.3)] disabled:opacity-40"
            style={{ background: "var(--brand-gradient)" }}
          >
            Siguiente →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending || !canNext()}
            className="rounded-xl px-5 py-2.5 font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,87,255,0.3)] disabled:opacity-40"
            style={{ background: "var(--brand-gradient)" }}
          >
            {pending ? "Guardando…" : "Publicar novedad"}
          </button>
        )}
      </div>
    </div>
  );
}
