/** Rol de un miembro dentro de un espacio de trabajo. */
export type Role = "owner" | "admin" | "member";

/** Admin = dueño o admin. Tiene acceso total dentro del espacio. */
export function isAdmin(role: string | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** Etiqueta legible del rol (para la UI). */
export function roleLabel(role: string): string {
  if (role === "owner") return "Dueño";
  if (role === "admin") return "Admin";
  return "Empleado";
}
