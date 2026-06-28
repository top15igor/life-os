import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { googleHealthConfigured, googleHealthAuthUrl } from "@/lib/googleHealth";

export const runtime = "nodejs";

// Шаг 1 OAuth: «Подключить Fitbit» → экран согласия Google (Google Health API).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/about", req.url));
  if (!googleHealthConfigured()) return NextResponse.redirect(new URL("/health?fitbit=notconfigured", req.url));

  const redirectUri = `${req.nextUrl.origin}/api/integrations/google-health/callback`;
  const state = randomUUID();
  const res = NextResponse.redirect(googleHealthAuthUrl(redirectUri, state));
  res.cookies.set("gh_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
