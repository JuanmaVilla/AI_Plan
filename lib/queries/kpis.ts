import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesUpdate } from "@/lib/types";

export type Kpi = Tables<"kpis">;

/** KPIs de varios objetivos, agrupados por objective_id. */
export async function getKpisByObjectives(
  teamId: string,
  objectiveIds: string[]
): Promise<Map<string, Kpi[]>> {
  const map = new Map<string, Kpi[]>();
  if (objectiveIds.length === 0) return map;

  const supabase = await createClient();
  const { data } = await supabase
    .from("kpis")
    .select("*")
    .eq("team_id", teamId)
    .in("objective_id", objectiveIds)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  for (const k of data ?? []) {
    const list = map.get(k.objective_id) ?? [];
    list.push(k);
    map.set(k.objective_id, list);
  }
  return map;
}

export type CreateKpiInput = {
  teamId: string;
  objectiveId: string;
  name: string;
  targetValue?: number | null;
  unit?: string;
};

export async function createKpi(input: CreateKpiInput): Promise<Kpi | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("kpis")
    .insert({
      team_id: input.teamId,
      objective_id: input.objectiveId,
      name: input.name.trim(),
      target_value: input.targetValue ?? null,
      unit: input.unit?.trim() ?? "",
    })
    .select("*")
    .single();
  return data ?? null;
}

export async function updateKpi(
  kpiId: string,
  patch: { name?: string; targetValue?: number | null; currentValue?: number; unit?: string }
): Promise<void> {
  const supabase = await createClient();
  const update: TablesUpdate<"kpis"> = {};
  if (patch.name !== undefined) update.name = patch.name.trim();
  if (patch.targetValue !== undefined) update.target_value = patch.targetValue;
  if (patch.currentValue !== undefined) update.current_value = patch.currentValue;
  if (patch.unit !== undefined) update.unit = patch.unit.trim();
  await supabase.from("kpis").update(update).eq("id", kpiId);
}

export async function deleteKpi(kpiId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("kpis").delete().eq("id", kpiId);
}
