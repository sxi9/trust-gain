import { NextRequest, NextResponse } from "next/server";
import { db, type ConsentCategory } from "@/lib/db";
import { currentParticipant } from "@/lib/session";

export const dynamic = "force-dynamic";

// A participant is "complete" only when every non-payment category they consented
// to has a passing result. Reveal happens only when BOTH are complete.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  const granted = d.consentsForParticipant(me.id).filter((c) => c.granted).map((c) => c.category);
  const required: ConsentCategory[] = granted.filter((c) => c !== "payment");
  const results = d.resultsForParticipant(me.id);

  const allPass = required.every((cat) => results.some((r) => r.kind === cat && r.status === "pass"));
  if (required.length === 0) {
    return NextResponse.json({ error: "Consent to and complete at least one check first." }, { status: 400 });
  }
  if (!allPass) {
    return NextResponse.json({ error: "Finish and pass each check you consented to first." }, { status: 400 });
  }

  d.updateParticipant(me.id, { status: "complete" });
  const parts = d.participantsForDeal(params.id);
  if (parts.length === 2 && parts.every((p) => p.status === "complete")) {
    d.updateDeal(params.id, { status: "both_verified" });
  }

  return NextResponse.json({ ok: true });
}
