import type { CautionLevel } from "../db";

export interface RiskFlag {
  label: string;
  value: string;
  tone: "neutral" | "caution";
  note: string;
}

export interface RiskResult {
  providerRef: string;
  status: "pass" | "fail";
  cautionLevel: CautionLevel;
  flags: RiskFlag[];
}

export interface RiskProvider {
  name: string;
  checkConnection(input: {
    ip: string;
    userAgent: string;
    statedCountry?: string | null;
  }): Promise<RiskResult>;
  checkContact(input: {
    email?: string;
    phone?: string;
    statedCountry?: string | null;
  }): Promise<RiskResult>;
}

export interface IdentitySession {
  sessionId: string;
  redirectUrl: string;
}

export interface IdentityResolution {
  providerRef: string;
  status: "pass" | "fail";
  verifiedName?: string;
  country?: string;
  checks: { label: string; value: string }[];
}

export interface IdentityProvider {
  name: string;
  createSession(input: { participantId: string; dealId: string }): Promise<IdentitySession>;
  resolve(input: {
    sessionId: string;
    outcome: "pass" | "fail";
    displayName?: string | null;
    statedCountry?: string | null;
  }): Promise<IdentityResolution>;
}

export interface EscrowProvider {
  name: string;
  createHold(input: { dealId: string; amount: number; currency: string }): Promise<{ holdId: string; status: string }>;
  release(holdId: string): Promise<{ status: string }>;
  refund(holdId: string): Promise<{ status: string }>;
}
