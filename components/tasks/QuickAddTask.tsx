"use client";

import { useRef, useState, useTransition } from "react";
import { createTodayTaskAction } from "@/app/(app)/hoy/actions";
import { Button } from "@/components/ui/button";

export function QuickAddTask() {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const clean = title.trim();
    if (!clean) return;
    setError(null);
    startTransition(async () => {
      const res = await createTodayTaskAction(clean);
      if (res.ok) {
        setTitle("");
        inputRef.current?.focus();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Agregar tarea para hoy…"
          className="flex-1 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none transition-colors placeholder:text-fg-disabled focus:border-[var(--border-active)]"
        />
        <Button onClick={submit} disabled={pending || !title.trim()}>
          {pending ? "…" : "Agregar"}
        </Button>
      </div>
      {error && <p className="font-body text-sm text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
