import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const password = String(form.get("password") || "").trim();
  const from = String(form.get("from") || "/");
  const target = from.startsWith("/") && !from.startsWith("/login") ? from : "/";
  const expected = (process.env.APP_PASSWORD || "").trim();

  if (!expected || password !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "?e=1";
    return NextResponse.redirect(url, 303);
  }

  const res = NextResponse.redirect(new URL(target, req.url), 303);
  res.cookies.set("lifeos_auth", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
