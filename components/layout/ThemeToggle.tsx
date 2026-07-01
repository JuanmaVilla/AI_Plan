"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    const d = document.documentElement;
    if (next) {
      d.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      d.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Modo claro" : "Modo oscuro"}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 font-body text-sm font-medium text-fg-muted transition-colors hover:bg-white/5 hover:text-fg ${
        collapsed ? "justify-center" : ""
      }`}
    >
      {dark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
      {!collapsed && <span>{dark ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
