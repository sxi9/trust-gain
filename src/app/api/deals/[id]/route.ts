import { NextRequest, NextResponse } from "next/server";
import { db, type CautionLevel } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { CONSENT_ITEMS } from "@/lib/consent";

export const dynamic = "force-dynamic";

const RANK: Record<CautionLevel, number> = { low: 0, medium: 1, high: 2 };

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const d = db();
  const deal = d.getDeal(params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

  const me = currentParticipant(params.id);
  const parts = d.participantsForDeal(params.id);
  const counterpart = me ? parts.find((p) => p.id !== me.id) : undefined;
  const revealed = parts.length === 2 && parts.every((p) => p.status === "complete");

  if (revealed && deal.status === "both_verified") d.updateDeal(params.id, { status: "revealed" });

  function card(pid: string) {
    const p = d.getParticipant(pid)!;
    const results = d.resultsForParticipant(pid);
    const caution = results.reduce<CautionLevel>(
      (acc, r) => (RANK[r.cautionLevel] > RANK[acc] ? r.cautionLevel : acc),
      "low",
    );
    return {
      displayName: p.displayName,
      status: p.status,
      role: p.role,
      caution,
      results: results.map((r) => ({ kind: r.kind, status: r.status, cautionLevel: r.cautionLevel, summary: r.summary })),
    };
  }

  return NextResponse.json({
    deal: {
      id: deal.id,
      title: deal.title,
      description: deal.description,
      roughValue: deal.roughValue,
      currency: deal.currency,
      requiresPayment: deal.requiresPayment,
      status: revealed ? "revealed" : deal.status,
      escrowStatus: deal.escrowStatus,
      inviteToken: me?.role === "creator" ? deal.inviteToken : undefined,
    },
    me: me
      ? {
          id: me.id,
          role: me.role,
          displayName: me.displayName,
          statedCountry: me.statedCountry,
          status: me.status,
          consents: d.consentsForParticipant(me.id).filter((c) => c.granted).map((c) => c.category),
          card: card(me.id),
        }
      : null,
    counterpart: counterpart
      ? {
          present: true,
          status: counterpart.status,
          card: revealed ? card(counterpart.id) : null,
        }
      : { present: false },
    revealed,
    consentCatalog: CONSENT_ITEMS,
    needsJoin: !me,
  });
}
