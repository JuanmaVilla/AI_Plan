import type { TaskWithMeta } from "@/lib/queries/tasks";

export type ObjectiveGroup = {
  key: string;
  icon: string;
  name: string;
  tasks: TaskWithMeta[];
};

export type ProjectGroup = {
  key: string;
  icon: string;
  name: string;
  color: string;
  objectives: ObjectiveGroup[];
  taskCount: number;
};

/**
 * Agrupa tareas por proyecto → objetivo, conservando el orden de aparición.
 * Reutilizado por el Backlog (página /backlog) y el panel Backlog de Semana,
 * para que ambos se vean iguales (color del proyecto + objetivos claros).
 */
export function groupByProjectObjective(tasks: TaskWithMeta[]): ProjectGroup[] {
  const projects = new Map<
    string,
    ProjectGroup & { _objectives: Map<string, ObjectiveGroup> }
  >();

  for (const t of tasks) {
    const pKey = t.project?.name ?? "—";
    if (!projects.has(pKey)) {
      projects.set(pKey, {
        key: pKey,
        icon: t.project?.icon ?? "📌",
        name: t.project?.name ?? "Sin proyecto",
        color: t.project?.color ?? "#5b8def",
        objectives: [],
        taskCount: 0,
        _objectives: new Map(),
      });
    }
    const pg = projects.get(pKey)!;
    pg.taskCount += 1;

    const oKey = t.objective?.id ?? "—";
    if (!pg._objectives.has(oKey)) {
      pg._objectives.set(oKey, {
        key: oKey,
        icon: t.objective?.icon ?? "🎯",
        name: t.objective?.name ?? "Sin objetivo",
        tasks: [],
      });
    }
    pg._objectives.get(oKey)!.tasks.push(t);
  }

  return [...projects.values()].map((pg) => ({
    key: pg.key,
    icon: pg.icon,
    name: pg.name,
    color: pg.color,
    taskCount: pg.taskCount,
    objectives: [...pg._objectives.values()],
  }));
}
