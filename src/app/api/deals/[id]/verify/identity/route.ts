import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { identityProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

// Creates a hosted verification session. The provider captures the ID + selfie on
// ITS hosted page; those images never reach TrustGain. We return the redirect URL.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  if (!d.hasConsent(me.id, "identity")) {
    return NextResponse.json({ error: "Separate biometric consent is required first." }, { status: 403 });
  }

  const session = await identityProvider().createSession({ participantId: me.id, dealId: params.id });
  return NextResponse.json({ redirectUrl: session.redirectUrl, sessionId: session.sessionId });
}
