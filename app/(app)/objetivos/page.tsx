import { redirect } from "next/navigation";

// Los objetivos ahora viven dentro de cada proyecto. Redirigimos.
export default function ObjetivosPage() {
  redirect("/proyectos");
}
