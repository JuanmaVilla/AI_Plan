import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday as dfIsToday,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

/** Zona horaria por defecto (cuando el usuario no eligió una). */
export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Zonas horarias por país para el selector de perfil. */
export const TIMEZONE_OPTIONS: { label: string; value: string }[] = [
  { label: "Argentina (Buenos Aires)", value: "America/Argentina/Buenos_Aires" },
  { label: "Uruguay (Montevideo)", value: "America/Montevideo" },
  { label: "Chile (Santiago)", value: "America/Santiago" },
  { label: "Paraguay (Asunción)", value: "America/Asuncion" },
  { label: "Bolivia (La Paz)", value: "America/La_Paz" },
  { label: "Brasil (São Paulo)", value: "America/Sao_Paulo" },
  { label: "Perú (Lima)", value: "America/Lima" },
  { label: "Colombia (Bogotá)", value: "America/Bogota" },
  { label: "Ecuador (Guayaquil)", value: "America/Guayaquil" },
  { label: "Venezuela (Caracas)", value: "America/Caracas" },
  { label: "México (Ciudad de México)", value: "America/Mexico_City" },
  { label: "EE. UU. — Este (New York)", value: "America/New_York" },
  { label: "EE. UU. — Central (Chicago)", value: "America/Chicago" },
  { label: "EE. UU. — Pacífico (Los Ángeles)", value: "America/Los_Angeles" },
  { label: "España (Madrid)", value: "Europe/Madrid" },
];

/**
 * Fecha de hoy en 'yyyy-MM-dd' (lo que guarda scheduled_date).
 * Con `timeZone` calcula el día en la zona del usuario (clave en el servidor,
 * que corre en UTC). Sin zona, usa la hora local del entorno (navegador).
 */
export function todayISO(timeZone?: string): string {
  if (timeZone) {
    // en-CA formatea como 'YYYY-MM-DD'.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }
  return format(new Date(), "yyyy-MM-dd");
}

/** Convierte un Date a 'yyyy-MM-dd'. */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Offset (en ms) de una zona horaria en un instante dado: hora_local - UTC.
 * Ej: Buenos Aires (UTC-3) → -3*3600*1000. Considera DST del instante.
 */
function tzOffsetMs(timeZone: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(at)) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  // Intl da hour 24 para medianoche en algunos motores; normalizar a 0.
  const hour = p.hour === 24 ? 0 : p.hour;
  const asUTC = Date.UTC(p.year, p.month - 1, p.day, hour, p.minute, p.second);
  return asUTC - at.getTime();
}

/**
 * Instante UTC (ISO con 'Z') de la medianoche local de `dayISO` en `timeZone`.
 * Sirve como cota para comparar contra columnas `timestamptz` sin corrimiento
 * de zona horaria (el server corre en UTC).
 */
export function zonedDayStartUtc(dayISO: string, timeZone: string): string {
  const utcMidnight = Date.parse(dayISO + "T00:00:00Z");
  const offset = tzOffsetMs(timeZone, new Date(utcMidnight));
  return new Date(utcMidnight - offset).toISOString();
}

/** Igual que `zonedDayStartUtc` pero para el día siguiente (cota superior con `<`). */
export function zonedNextDayStartUtc(dayISO: string, timeZone: string): string {
  const next = toISODate(addDays(parseISO(dayISO), 1));
  return zonedDayStartUtc(next, timeZone);
}

/** Fecha 'yyyy-MM-dd' de un instante, en la zona del usuario (para agrupar por día). */
export function isoDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Lunes a domingo de la semana actual, como array de 7 'yyyy-MM-dd'. */
export function currentWeekDays(base: Date = new Date()): string[] {
  const monday = startOfWeek(base, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(monday, i)));
}

export function weekRange(base: Date = new Date()): { start: string; end: string } {
  return {
    start: toISODate(startOfWeek(base, { weekStartsOn: 1 })),
    end: toISODate(endOfWeek(base, { weekStartsOn: 1 })),
  };
}

/** 30 días desde el lunes de la semana actual (los primeros 7 = la semana). */
export function next30Days(base: Date = new Date()): string[] {
  const monday = startOfWeek(base, { weekStartsOn: 1 });
  return Array.from({ length: 30 }, (_, i) => toISODate(addDays(monday, i)));
}

export function monthRange(base: Date = new Date()): { start: string; end: string } {
  const monday = startOfWeek(base, { weekStartsOn: 1 });
  return { start: toISODate(monday), end: toISODate(addDays(monday, 29)) };
}

/** ¿La fecha ISO 'yyyy-MM-dd' es hoy? Si se pasa `todayStr` (ya en la zona del
 *  usuario) compara contra eso; si no, usa la hora local del entorno. */
export function isToday(iso: string, todayStr?: string): boolean {
  if (todayStr) return iso === todayStr;
  return dfIsToday(parseISO(iso));
}

/** Etiqueta humana en español, ej. "lunes 30 de junio". */
export function humanDay(iso: string): string {
  return format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
}
