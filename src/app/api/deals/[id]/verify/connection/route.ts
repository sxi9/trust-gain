import { NextRequest, NextResponse } from "next/server";
import { db, expiryIso } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { riskProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  // CONSENT GATE: refuse to collect anything without a granted receipt.
  if (!d.hasConsent(me.id, "connection")) {
    return NextResponse.json({ error: "Consent required before this check can run." }, { status: 403 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.ip ||
    "203.0.113." + (1 + (me.id.length % 250));
  const ua = req.headers.get("user-agent") ?? "unknown";

  const r = await riskProvider().checkConnection({ ip, userAgent: ua, statedCountry: me.statedCountry });
  const saved = d.saveResult({
    participantId: me.id,
    kind: "connection",
    status: r.status,
    providerRef: r.providerRef,
    summary: { flags: r.flags },
    cautionLevel: r.cautionLevel,
    expiresAt: expiryIso(),
  });

  return NextResponse.json({ result: { kind: "connection", status: saved.status, cautionLevel: saved.cautionLevel, summary: saved.summary } });
}
