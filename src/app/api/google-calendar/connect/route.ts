import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { GCAL_SCOPE } from "@/lib/googleCalendar";

export const runtime = "nodejs";

function originOf(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || req.nextUrl.host;
  const proto = req.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// Step 1: send the logged-in user to Google to grant calendar.events access.
// Requires being logged in (cookie checked on the way back in the callback).
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return NextResponse.redirect(new URL("/reminders?cal=noenv", req.url));

  const redirectUri = `${originOf(req)}/api/google-calendar/callback`;
  const state = randomBytes(16).toString("hex");
  // Where to return after connecting (defaults to /reminders).
  const back = req.nextUrl.searchParams.get("back") || "/reminders";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GCAL_SCOPE,
    state,
    access_type: "offline", // we need a refresh token
    prompt: "consent", // force refresh_token issuance every time
    include_granted_scopes: "true",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  const opts = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 600 };
  res.cookies.set("lifeos_gcal_state", state, opts);
  res.cookies.set("lifeos_gcal_back", back, opts);
  return res;
}
