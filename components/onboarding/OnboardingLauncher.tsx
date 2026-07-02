"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

// El tour usa muchas animaciones (motion): se carga en diferido, solo cuando abre.
const OnboardingTour = dynamic(
  () => import("@/components/onboarding/OnboardingTour").then((m) => m.OnboardingTour),
  { ssr: false }
);

const SEEN_KEY = "onboarding-tour-seen";

/**
 * Abre el tour a pantalla completa la primera vez (una sola vez) y deja una
 * burbujita flotante para volver a verlo cuando se quiera.
 */
export function OnboardingLauncher() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Auto-abrir solo si nunca se vio.
    if (localStorage.getItem(SEEN_KEY) !== "1") setOpen(true);
    setReady(true);
  }, []);

  function close() {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  return (
    <>
      {/* Solo se monta (y carga su chunk) cuando el tour abre. */}
      {open && <OnboardingTour open={open} onClose={close} />}

      {/* Burbuja para reabrir el tour (oculta mientras está abierto) */}
      {ready && !open && (
        <motion.button
          type="button"
          onClick={() => setOpen(true)}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Ver la guía de uso"
          title="Ver la guía de uso"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full px-4 py-3 font-body text-sm font-bold text-white shadow-[0_10px_30px_rgba(0,87,255,0.45)]"
          style={{ background: "var(--brand-gradient)" }}
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">Guía</span>
        </motion.button>
      )}
    </>
  );
}
