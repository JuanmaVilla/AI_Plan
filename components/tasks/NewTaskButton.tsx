"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";

export function NewTaskButton({
  label = "Nueva tarea",
  defaultDay = "backlog",
  variant,
  className,
  showIcon = true,
  iconBefore,
}: {
  label?: string;
  defaultDay?: "backlog" | "hoy" | "fecha";
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  showIcon?: boolean;
  iconBefore?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} variant={variant} className={`gap-2 ${className ?? ""}`}>
        {iconBefore}
        {showIcon && <Plus className="h-4 w-4" />}
        {label}
      </Button>
      <NewTaskDialog open={open} onOpenChange={setOpen} defaultDay={defaultDay} />
    </>
  );
}
