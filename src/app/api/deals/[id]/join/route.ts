import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookieName, currentParticipant } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body: any = await req.json().catch(() => ({}));
  const d = db();
  const deal = d.getDeal(params.id);
  if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

  if (currentParticipant(params.id)) return NextResponse.json({ ok: true, alreadyJoined: true });

  if (String(body.inviteToken ?? "") !== deal.inviteToken) {
    return NextResponse.json({ error: "This invite link is not valid." }, { status: 403 });
  }

  const parts = d.participantsForDeal(params.id);
  if (parts.some((p) => p.role === "invitee")) {
    return NextResponse.json({ error: "Someone has already joined this deal." }, { status: 409 });
  }

  const invitee = d.createParticipant({
    dealId: deal.id,
    role: "invitee",
    displayName: body.displayName ? String(body.displayName).trim() : null,
    statedCountry: body.statedCountry ? String(body.statedCountry).trim().toUpperCase().slice(0, 2) : null,
    status: "active",
  });

  const res = NextResponse.json({ ok: true, participantId: invitee.id });
  res.cookies.set(cookieName(deal.id), invitee.token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
