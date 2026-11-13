import { NextRequest, NextResponse } from "next/server";
import { db, expiryIso } from "@/lib/db";
import { currentParticipant } from "@/lib/session";
import { identityProvider } from "@/lib/providers";

export const dynamic = "force-dynamic";

// NOTE: in production the verification OUTCOME arrives as a SIGNED, server-to-server
// webhook from the licensed provider, not a client call. We model it here as a POST
// from the simulator page. We store ONLY a pass/fail plus the verified name and
// country and the check list — never the ID image, ID number, or any biometric.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const me = currentParticipant(params.id);
  if (!me) return NextResponse.json({ error: "No session for this deal." }, { status: 401 });

  const d = db();
  if (!d.hasConsent(me.id, "identity")) {
    return NextResponse.json({ error: "Consent required." }, { status: 403 });
  }

  const body: any = await req.json().catch(() => ({}));
  const outcome = body.outcome === "fail" ? "fail" : "pass";
  const sessionId = String(body.sessionId ?? "");

  const resolution = await identityProvider().resolve({
    sessionId,
    outcome,
    displayName: me.displayName,
    statedCountry: me.statedCountry,
  });

  const saved = d.saveResult({
    participantId: me.id,
    kind: "identity",
    status: resolution.status,
    providerRef: resolution.providerRef,
    summary: {
      verifiedName: resolution.verifiedName ?? null,
      country: resolution.country ?? null,
      checks: resolution.checks,
    },
    cautionLevel: resolution.status === "pass" ? "low" : "high",
    expiresAt: expiryIso(),
  });

  return NextResponse.json({ result: { kind: "identity", status: saved.status, cautionLevel: saved.cautionLevel, summary: saved.summary } });
}
