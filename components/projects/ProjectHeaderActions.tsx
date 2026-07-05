"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";

/** Lápiz de edición en el encabezado del detalle de proyecto (solo admin). */
export function ProjectHeaderActions({
  projectId,
  name,
  icon,
  color,
}: {
  projectId: string;
  name: string;
  icon: string;
  color: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Editar proyecto"
        title="Editar nombre, ícono y color"
        className="text-fg-disabled transition-colors hover:text-fg"
      >
        <Pencil className="h-5 w-5" />
      </button>
      <EditProjectDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        currentName={name}
        currentIcon={icon}
        currentColor={color}
      />
    </>
  );
}
