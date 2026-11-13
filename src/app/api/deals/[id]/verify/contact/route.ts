import { NextRequest, NextResponse } from "next/server";
import { db, expiryIso } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { riskProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  if (!d.hasConsent(me.id, "contact")) {
    return NextResponse.json({ error: "Consent required before this check can run." }, { status: 403 });
  }

  const body: any = await req.json().catch(() => ({}));
  const email = body.email ? String(body.email).trim() : undefined;
  const phone = body.phone ? String(body.phone).trim() : undefined;
  if (!email && !phone) {
    return NextResponse.json({ error: "Enter an email or phone number." }, { status: 400 });
  }

  const r = await riskProvider().checkContact({ email, phone, statedCountry: me.statedCountry });
  const saved = d.saveResult({
    participantId: me.id,
    kind: "contact",
    status: r.status,
    providerRef: r.providerRef,
    summary: { flags: r.flags },
    cautionLevel: r.cautionLevel,
    expiresAt: expiryIso(),
  });

  return NextResponse.json({ result: { kind: "contact", status: saved.status, cautionLevel: saved.cautionLevel, summary: saved.summary } });
}
