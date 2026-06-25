import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/welcome", req.url));
  res.cookies.set("lifeos_token", "", { maxAge: 0, path: "/" });
  return res;
}
