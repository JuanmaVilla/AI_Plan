import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types";

/** Rutas públicas (no requieren sesión). */
const PUBLIC_PATHS = ["/login", "/auth"];

/**
 * Refresca la sesión en cada request y protege la zona privada.
 * Si no hay sesión y la ruta no es pública → redirige a /login.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no meter lógica entre createServerClient y getClaims().
  // getClaims() verifica el JWT localmente (con claves asimétricas) → sin
  // viaje de red a Supabase en cada navegación. getClaims también refresca
  // el token si hace falta, igual que getUser.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = !!data?.claims?.sub;

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isLoggedIn && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Si ya hay sesión y va a /login → mandarlo a Hoy.
  if (isLoggedIn && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/hoy";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
