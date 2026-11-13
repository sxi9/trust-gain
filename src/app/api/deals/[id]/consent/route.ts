import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { CONSENT_ITEMS, POLICY_VERSION, disclosureHash } from "@/lib/consent";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const body: any = await req.json().catch(() => ({}));
  const items: { category: string; granted: boolean }[] = Array.isArray(body.consents) ? body.consents : [];
  const d = db();

  for (const it of items) {
    const known = CONSENT_ITEMS.find((c) => c.category === it.category);
    if (!known) continue;
    d.recordConsent({
      participantId: me.id,
      category: known.category,
      granted: !!it.granted,
      policyVersion: POLICY_VERSION,
      disclosureHash: disclosureHash(known.category),
    });
  }

  return NextResponse.json({ ok: true, granted: d.consentsForParticipant(me.id).filter((c) => c.granted).map((c) => c.category) });
}
