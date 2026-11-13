import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { escrowProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

// Demo escrow orchestration. The licensed provider custodies funds; TrustGain only
// records the state and never holds money. Release/refund follow fixed rules, not
// platform discretion.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  const deal = d.getDeal(params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  if (!deal.requiresPayment) return NextResponse.json({ error: "This deal has no payment." }, { status: 400 });

  const parts = d.participantsForDeal(params.id);
  const bothComplete = parts.length === 2 && parts.every((p) => p.status === "complete");
  if (!bothComplete) return NextResponse.json({ error: "Both sides must be verified first." }, { status: 400 });

  const body: any = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const provider = escrowProvider();

  if (action === "hold") {
    await provider.createHold({ dealId: deal.id, amount: deal.roughValue, currency: deal.currency });
    d.updateDeal(params.id, { escrowStatus: "held" });
  } else if (action === "release") {
    await provider.release("hold_demo");
    d.updateDeal(params.id, { escrowStatus: "released", status: "completed" });
  } else if (action === "refund") {
    await provider.refund("hold_demo");
    d.updateDeal(params.id, { escrowStatus: "refunded", status: "completed" });
  } else {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, escrowStatus: d.getDeal(params.id)?.escrowStatus });
}
