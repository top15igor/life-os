import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mapkitToken } from "@/lib/mapkit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Токен для карт Apple. Только своим: квота считается на наш аккаунт
// разработчика, и раздавать её случайным сайтам незачем.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("", { status: 401 });

  const token = mapkitToken(req.nextUrl.origin);
  if (!token) return new NextResponse("", { status: 503 });

  return new NextResponse(token, {
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  });
}
