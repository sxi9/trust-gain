import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookieName } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body: any = await req.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "A deal title is required." }, { status: 400 });

  const roughValue = Number(body.roughValue ?? 0) || 0;
  const requiresPayment = Boolean(body.requiresPayment) && roughValue > 0;

  const d = db();
  const deal = d.createDeal({
    title,
    description: String(body.description ?? "").trim(),
    roughValue,
    currency: String(body.currency ?? "USD").toUpperCase().slice(0, 3),
    requiresPayment,
  });
  const creator = d.createParticipant({
    dealId: deal.id,
    role: "creator",
    displayName: body.displayName ? String(body.displayName).trim() : null,
    statedCountry: body.statedCountry ? String(body.statedCountry).trim().toUpperCase().slice(0, 2) : null,
    status: "active",
  });

  const res = NextResponse.json({ dealId: deal.id, inviteToken: deal.inviteToken, participantId: creator.id });
  res.cookies.set(cookieName(deal.id), creator.token, { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
