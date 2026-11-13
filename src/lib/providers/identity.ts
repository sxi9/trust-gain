/**
 * Mock identity provider, shaped like Stripe Identity.
 *
 * KEY PROPERTY: createSession() returns a HOSTED capture URL. In production that
 * URL belongs to the licensed provider; the user's ID photos and selfie upload
 * directly to the provider and NEVER pass through TrustGain. The result arrives
 * via a signed server-to-server webhook, and TrustGain keeps only a pass/fail
 * token plus the verified name and country. Here we point at an in-app simulator
 * page and resolve through our own webhook route to model that exact shape.
 */
import crypto from "crypto";
import type { IdentityProvider, IdentitySession, IdentityResolution } from "./types";

export class MockIdentityProvider implements IdentityProvider {
  name = "mock-identity (Stripe Identity-shaped)";

  async createSession(input: { participantId: string; dealId: string }): Promise<IdentitySession> {
    const sessionId = "idv_" + crypto.randomBytes(9).toString("hex");
    const redirectUrl = `/deal/${input.dealId}/idv?session=${sessionId}`;
    return { sessionId, redirectUrl };
  }

  async resolve(input: {
    sessionId: string;
    outcome: "pass" | "fail";
    displayName?: string | null;
    statedCountry?: string | null;
  }): Promise<IdentityResolution> {
    if (input.outcome === "fail") {
      return {
        providerRef: input.sessionId,
        status: "fail",
        checks: [
          { label: "Document authenticity", value: "Could not verify" },
          { label: "Liveness", value: "Not confirmed" },
        ],
      };
    }
    const name = (input.displayName && input.displayName.trim()) || "Verified Person";
    return {
      providerRef: input.sessionId,
      status: "pass",
      verifiedName: name,
      country: (input.statedCountry || "US").toUpperCase(),
      checks: [
        { label: "Document authenticity", value: "Genuine" },
        { label: "Liveness", value: "Live person confirmed" },
        { label: "Face match", value: "Matches ID portrait" },
        { label: "Injection / deepfake", value: "No tampering detected" },
      ],
    };
  }
}
