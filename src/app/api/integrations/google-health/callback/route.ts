import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { googleHealthExchangeCode, syncGoogleHealth } from "@/lib/googleHealth";

export const runtime = "nodejs";
export const maxDuration = 60;

// Шаг 2 OAuth: Google вернул код → меняем на токены, подтягиваем историю,
// возвращаем на «Здоровье».
export async function GET(req: NextRequest) {
  const back = (q: string) => NextResponse.redirect(new URL(`/health?${q}`, req.url));

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/about", req.url));

  const sp = req.nextUrl.searchParams;
  if (sp.get("error")) return back("fitbit=denied");

  const code = sp.get("code");
  const state = sp.get("state");
  const cookieState = req.cookies.get("gh_state")?.value;
  if (!code || !state || !cookieState || state !== cookieState) return back("fitbit=error");

  try {
    const redirectUri = `${req.nextUrl.origin}/api/integrations/google-health/callback`;
    await googleHealthExchangeCode(user.id, code, redirectUri);
    await syncGoogleHealth(user.id, 30); // история за последний месяц
  } catch (e) {
    console.error("google-health callback", e);
    return back("fitbit=error");
  }

  const res = back("fitbit=ok");
  res.cookies.delete("gh_state");
  return res;
}
