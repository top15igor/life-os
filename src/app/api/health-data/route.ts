import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getHealthMetrics } from "@/lib/healthMetrics";
import { isGoogleHealthConnected, googleHealthConfigured } from "@/lib/googleHealth";

export const runtime = "nodejs";

// Health screen data for the native app: connection state + last 30 days of
// steps / sleep / heart rate (shared table for Apple Health + Google Health).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });

  const [metrics, googleConnected] = await Promise.all([
    getHealthMetrics(user.id, 30),
    isGoogleHealthConnected(user.id).catch(() => false),
  ]);

  return NextResponse.json({
    ok: true,
    googleConfigured: googleHealthConfigured(),
    googleConnected,
    days: metrics.days,
    latest: metrics.latest,
  });
}
