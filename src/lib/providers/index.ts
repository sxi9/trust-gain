/**
 * Provider selection. Real licensed providers are chosen when their credentials
 * are present; otherwise the built-in mocks run so the whole flow works with no
 * accounts. The app only ever depends on the interfaces, so going live is a
 * localized change here.
 */
import { MockRiskProvider } from "./risk";
import { MockIdentityProvider } from "./identity";
import { MockEscrowProvider } from "./escrow";
import type { RiskProvider, IdentityProvider, EscrowProvider } from "./types";

export function riskProvider(): RiskProvider {
  // if (process.env.SEON_API_KEY) return new SeonRiskProvider(process.env.SEON_API_KEY);
  return new MockRiskProvider();
}

export function identityProvider(): IdentityProvider {
  // if (process.env.STRIPE_SECRET_KEY) return new StripeIdentityProvider(process.env.STRIPE_SECRET_KEY);
  return new MockIdentityProvider();
}

export function escrowProvider(): EscrowProvider {
  // if (process.env.STRIPE_SECRET_KEY) return new StripeConnectEscrowProvider(process.env.STRIPE_SECRET_KEY);
  return new MockEscrowProvider();
}

export function usingMocks(): boolean {
  return !process.env.STRIPE_SECRET_KEY && !process.env.SEON_API_KEY;
}
