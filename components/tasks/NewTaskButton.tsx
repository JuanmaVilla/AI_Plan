"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";

export function NewTaskButton({
  label = "Nueva tarea",
  defaultDay = "backlog",
}: {
  label?: string;
  defaultDay?: "backlog" | "hoy" | "fecha";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        {label}
      </Button>
      <NewTaskDialog open={open} onOpenChange={setOpen} defaultDay={defaultDay} />
    </>
  );
}
