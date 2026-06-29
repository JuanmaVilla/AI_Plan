import { type NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback de confirmación de email.
 * Soporta los dos formatos de enlace de Supabase:
 *  - PKCE:        ?code=...
 *  - OTP/token:   ?token_hash=...&type=signup
 * Tras verificar, deja la sesión en cookies y manda a /hoy.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = searchParams.get("next") ?? "/hoy";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Falló o faltan parámetros → de vuelta a login con aviso.
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
