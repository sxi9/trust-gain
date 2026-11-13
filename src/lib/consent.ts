/**
 * Consent is the gate. Nothing is collected and no signal is gathered until the
 * participant has an explicit, granted consent receipt for that category. Each
 * category has plain-language disclosure text; the identity step is a separate,
 * unbundled, biometric-grade consent (GDPR Art. 9 / BIPA style).
 */
import crypto from "crypto";
import type { ConsentCategory } from "./db";

export const POLICY_VERSION = "2026-11-13";

export interface ConsentItem {
  category: ConsentCategory;
  title: string;
  biometric: boolean;
  disclosure: string;
}

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    category: "connection",
    title: "Connection & device signals",
    biometric: false,
    disclosure:
      "We check your current connection and device once, now: whether a VPN or proxy is in use, how new or recognized this device is, and whether your connection's country matches the country you state. The other person sees these as neutral risk flags, never as proof of anything. No continuous monitoring and no location tracking. Kept only for this deal.",
  },
  {
    category: "contact",
    title: "Email & phone",
    biometric: false,
    disclosure:
      "We verify an email and/or phone number you enter, and flag disposable, temporary, or VoIP numbers. The other person sees only the pass/fail and neutral flags, never your raw address or number. Kept only for this deal.",
  },
  {
    category: "identity",
    title: "Government ID & liveness selfie (biometric)",
    biometric: true,
    disclosure:
      "A licensed identity provider captures a photo of your government ID and a liveness selfie to confirm you are a real, present person and that the ID is genuine. Those images and any biometric data are processed by the licensed provider and are NEVER sent to or stored by TrustGain. TrustGain receives only a pass/fail plus your verified name and country. This is a biometric check: it is optional, you may decline, and you may withdraw. Results are kept only for this deal, then deleted.",
  },
  {
    category: "payment",
    title: "Payment protection (escrow)",
    biometric: false,
    disclosure:
      "If this deal involves money, the funds are held by a licensed payment/escrow provider until both sides confirm. TrustGain never holds your money and never stores card details. The provider releases to the seller on mutual confirmation, or refunds the buyer by fixed rules.",
  },
];

export function consentItem(category: ConsentCategory): ConsentItem | undefined {
  return CONSENT_ITEMS.find((c) => c.category === category);
}

export function disclosureHash(category: ConsentCategory): string {
  const item = consentItem(category);
  return crypto
    .createHash("sha256")
    .update(`${POLICY_VERSION}|${category}|${item?.disclosure ?? ""}`)
    .digest("hex");
}
