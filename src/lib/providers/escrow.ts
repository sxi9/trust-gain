/**
 * Mock escrow provider, shaped like Stripe Connect (separate charges & transfers
 * with manual payouts). The licensed provider custodies the funds; TrustGain only
 * orchestrates timing and never touches the money or card data.
 */
import crypto from "crypto";
import type { EscrowProvider } from "./types";

export class MockEscrowProvider implements EscrowProvider {
  name = "mock-escrow (Stripe Connect-shaped)";

  async createHold(_input: { dealId: string; amount: number; currency: string }) {
    return { holdId: "hold_" + crypto.randomBytes(8).toString("hex"), status: "held" };
  }
  async release(_holdId: string) {
    return { status: "released" };
  }
  async refund(_holdId: string) {
    return { status: "refunded" };
  }
}
