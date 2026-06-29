"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=/hoy`,
          },
        });
        if (error) throw error;

        if (!data.session) {
          // Confirmación de email activada en Supabase.
          setInfo("Te enviamos un correo para confirmar tu cuenta. Confirmá y volvé a entrar.");
          return;
        }
        router.push("/hoy");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/hoy");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? traducirError(err.message) : "Algo salió mal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="w-full max-w-sm rounded-[var(--radius-lg)] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-8 shadow-[var(--shadow-2)] backdrop-blur-xl">
        <h1
          className="text-gradient mb-1 font-display text-3xl font-extrabold tracking-tight"
          style={{ lineHeight: 1.1 }}
        >
          Hay Equipo
        </h1>
        <p className="mb-6 font-body text-sm text-fg-muted">
          {mode === "signin" ? "Entrá a tu equipo." : "Creá tu cuenta y tu equipo."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <Field
              label="Tu nombre"
              type="text"
              value={fullName}
              onChange={setFullName}
              placeholder="Juan"
              required
            />
          )}
          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="vos@ejemplo.com"
            required
          />
          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            required
          />

          {error && (
            <p className="font-body text-sm text-[var(--color-error)]">{error}</p>
          )}
          {info && (
            <p className="font-body text-sm text-accent-mint">{info}</p>
          )}

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading
              ? "Un momento…"
              : mode === "signin"
                ? "Entrar"
                : "Crear cuenta"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setInfo(null);
          }}
          className="mt-4 w-full font-body text-sm text-fg-muted transition-colors hover:text-accent-cyan"
        >
          {mode === "signin"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Entrá"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-body text-xs uppercase tracking-[0.12em] text-fg-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-surface px-3 py-2 font-body text-base text-fg outline-none transition-colors placeholder:text-fg-disabled focus:border-[var(--border-active)]"
      />
    </label>
  );
}

function traducirError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email o contraseña incorrectos.";
  if (m.includes("user already registered")) return "Ese email ya tiene cuenta. Entrá.";
  if (m.includes("password should be at least"))
    return "La contraseña es muy corta (mínimo 6 caracteres).";
  if (m.includes("unable to validate email")) return "Email inválido.";
  return msg;
}
