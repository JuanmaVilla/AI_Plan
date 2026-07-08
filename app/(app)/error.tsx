"use client";

import { useEffect } from "react";

/**
 * Error boundary de la zona privada. Si una query/acción lanza (p. ej. un fallo
 * de guardado que antes pasaba desapercibido), en vez de una pantalla rota el
 * usuario ve un mensaje claro y un botón para reintentar.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        No se pudo completar la acción. Puede ser un problema de conexión.
        Probá de nuevo; si sigue, recargá la página.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[color:var(--accent-500,#0057FF)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
