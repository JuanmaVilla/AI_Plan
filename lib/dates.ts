import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isToday as dfIsToday,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

/** Fecha de hoy en formato 'yyyy-MM-dd' (lo que guarda la columna scheduled_date). */
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/** Convierte un Date a 'yyyy-MM-dd'. */
export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
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

/** ¿La fecha ISO 'yyyy-MM-dd' es hoy? */
export function isToday(iso: string): boolean {
  return dfIsToday(parseISO(iso));
}

/** Etiqueta humana en español, ej. "lunes 30 de junio". */
export function humanDay(iso: string): string {
  return format(parseISO(iso), "EEEE d 'de' MMMM", { locale: es });
}
