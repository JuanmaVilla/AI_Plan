import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { getMyTeam } from "@/lib/queries/teams";
import { getTeamMembers } from "@/lib/queries/members";
import { getDailyWorkByMember } from "@/lib/queries/time";
import { getCurrentUser } from "@/lib/queries/auth";
import { getViewScope } from "@/lib/queries/scope";
import { currentWeekDays, weekRange, isToday } from "@/lib/dates";

function fmtMinutes(min: number): string {
  if (min <= 0) return "·";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default async function TiemposPage() {
  const [team, user, scope] = await Promise.all([getMyTeam(), getCurrentUser(), getViewScope()]);

  const days = currentWeekDays();
  const { start, end } = weekRange();

  const [allMembers, byMember] = await Promise.all([
    team ? getTeamMembers(team.team_id) : Promise.resolve([]),
    team
      ? getDailyWorkByMember(team.team_id, start, end)
      : Promise.resolve({} as Record<string, Record<string, number>>),
  ]);

  // "Solo lo mío": muestra únicamente la fila del usuario.
  const members =
    scope === "mine" && user ? allMembers.filter((m) => m.id === user.id) : allMembers;

  // Totales por día (columna) y total general.
  const dayTotals: Record<string, number> = {};
  let grandTotal = 0;
  for (const m of members) {
    const row = byMember[m.id] ?? {};
    for (const d of days) {
      const v = row[d] ?? 0;
      dayTotals[d] = (dayTotals[d] ?? 0) + v;
      grandTotal += v;
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <span className="font-body text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">
          {format(parseISO(start), "d 'de' MMM", { locale: es })} —{" "}
          {format(parseISO(end), "d 'de' MMM", { locale: es })}
        </span>
        <div className="flex items-end justify-between gap-4">
          <h1 className="font-display text-4xl font-black text-fg" style={{ letterSpacing: "-0.03em" }}>
            Tiempos
          </h1>
          <span className="font-body text-sm text-fg-muted">
            {fmtMinutes(grandTotal)} esta semana
          </span>
        </div>
        <p className="font-body text-sm text-fg-muted">Horas trabajadas por día y por persona</p>
      </header>

      {members.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-[var(--border-default)] px-8 py-16 text-center font-body text-sm text-fg-muted">
          Todavía no hay miembros en el equipo.
        </div>
      ) : (
        <div className="card-soft overflow-x-auto rounded-[26px] p-2">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-transparent px-4 py-3 text-left font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  Persona
                </th>
                {days.map((d) => (
                  <th
                    key={d}
                    className={`px-3 py-3 text-center font-body text-[11px] font-semibold uppercase tracking-[0.08em] ${
                      isToday(d) ? "text-accent-mint" : "text-fg-muted"
                    }`}
                  >
                    {format(parseISO(d), "EEE", { locale: es })}
                    <span className="block font-display text-sm text-fg">
                      {format(parseISO(d), "d")}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-body text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const row = byMember[m.id] ?? {};
                const total = days.reduce((s, d) => s + (row[d] ?? 0), 0);
                return (
                  <tr key={m.id} className="border-t border-[var(--border-default)]">
                    <td className="sticky left-0 z-10 px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ring-2 ring-white/10"
                          style={{ background: m.avatar_color }}
                        >
                          {m.full_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="truncate font-body text-sm font-semibold text-fg">
                          {m.full_name}
                        </span>
                      </div>
                    </td>
                    {days.map((d) => {
                      const v = row[d] ?? 0;
                      return (
                        <td
                          key={d}
                          className={`px-3 py-3 text-center font-body text-sm tabular-nums ${
                            v > 0 ? "text-fg-secondary" : "text-fg-disabled"
                          } ${isToday(d) ? "bg-white/[0.03]" : ""}`}
                        >
                          {fmtMinutes(v)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-display text-sm font-bold tabular-nums text-fg">
                      {fmtMinutes(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-active)]">
                <td className="sticky left-0 z-10 px-4 py-3 font-body text-xs font-semibold uppercase tracking-[0.12em] text-fg-muted">
                  Total
                </td>
                {days.map((d) => (
                  <td
                    key={d}
                    className="px-3 py-3 text-center font-body text-xs font-semibold tabular-nums text-fg-muted"
                  >
                    {fmtMinutes(dayTotals[d] ?? 0)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right font-display text-sm font-black tabular-nums text-accent-mint">
                  {fmtMinutes(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
