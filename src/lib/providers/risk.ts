/**
 * Mock risk provider, shaped like SEON. Flags are derived deterministically from
 * the inputs so the demo is stable. Every signal is framed as a NEUTRAL flag with
 * context, never as proof of guilt. Swap this class for a real SEON client; the
 * rest of the app depends only on the RiskProvider interface.
 */
import crypto from "crypto";
import type { RiskProvider, RiskResult, RiskFlag } from "./types";
import type { CautionLevel } from "../db";

const DISPOSABLE_DOMAINS = [
  "mailinator.com",
  "guerrillamail.com",
  "10minutemail.com",
  "tempmail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
];

function hashInt(s: string): number {
  return crypto.createHash("sha256").update(s).digest().readUInt32BE(0);
}

function ipCountry(ip: string): string {
  const countries = ["US", "GB", "DE", "IN", "NG", "BR", "CA", "FR", "AU", "AE"];
  return countries[hashInt("ipc" + ip) % countries.length];
}

function escalate(current: CautionLevel, next: CautionLevel): CautionLevel {
  const rank: Record<CautionLevel, number> = { low: 0, medium: 1, high: 2 };
  return rank[next] > rank[current] ? next : current;
}

export class MockRiskProvider implements RiskProvider {
  name = "mock-risk (SEON-shaped)";

  async checkConnection(input: {
    ip: string;
    userAgent: string;
    statedCountry?: string | null;
  }): Promise<RiskResult> {
    const flags: RiskFlag[] = [];
    let caution: CautionLevel = "low";

    const vpn = hashInt("vpn" + input.ip) % 100 < 30;
    flags.push({
      label: "Connection",
      value: vpn ? "VPN / proxy detected" : "Direct connection",
      tone: vpn ? "caution" : "neutral",
      note: vpn
        ? "Anonymized connection. Common for privacy-conscious or traveling users, not proof of anything."
        : "No anonymizer detected.",
    });
    if (vpn) caution = escalate(caution, "medium");

    const detected = ipCountry(input.ip);
    const stated = input.statedCountry ? input.statedCountry.toUpperCase() : null;
    const mismatch = !!stated && stated !== detected;
    flags.push({
      label: "Location",
      value: stated
        ? mismatch
          ? `Connecting from ${detected}, stated ${stated}`
          : `Consistent (${detected})`
        : `Connecting from ${detected}`,
      tone: mismatch ? "caution" : "neutral",
      note: mismatch
        ? "One-time, point-in-time check. Worth asking about; travelers see this too. No movement tracking."
        : "One-time check of connection country only. No movement tracking.",
    });
    if (mismatch) caution = escalate(caution, "medium");

    const newDevice = hashInt("dev" + input.userAgent + input.ip) % 100 < 40;
    flags.push({
      label: "Device",
      value: newDevice ? "New / unrecognized device" : "Established device",
      tone: newDevice ? "caution" : "neutral",
      note: newDevice
        ? "First time we have seen this device. Normal for new or borrowed devices."
        : "Seen before with consistent attributes.",
    });

    return {
      providerRef: "conn_" + hashInt("ref" + input.ip + input.userAgent).toString(16),
      status: "pass",
      cautionLevel: caution,
      flags,
    };
  }

  async checkContact(input: {
    email?: string;
    phone?: string;
    statedCountry?: string | null;
  }): Promise<RiskResult> {
    const flags: RiskFlag[] = [];
    let caution: CautionLevel = "low";

    if (input.email) {
      const domain = input.email.split("@")[1]?.toLowerCase() ?? "";
      const disposable = DISPOSABLE_DOMAINS.includes(domain);
      flags.push({
        label: "Email",
        value: disposable ? "Disposable / temporary address" : "Standard mailbox",
        tone: disposable ? "caution" : "neutral",
        note: disposable
          ? "Throwaway email domain. A persistent address is lower risk."
          : "Not a known disposable domain.",
      });
      if (disposable) caution = escalate(caution, "medium");
    }

    if (input.phone) {
      const voip = hashInt("voip" + input.phone) % 100 < 25;
      flags.push({
        label: "Phone",
        value: voip ? "VoIP / virtual number" : "Mobile / landline",
        tone: voip ? "caution" : "neutral",
        note: voip
          ? "Internet phone number. Easy to create and discard."
          : "Carrier-backed number.",
      });
      if (voip) caution = escalate(caution, "medium");
    }

    if (flags.length === 0) {
      flags.push({ label: "Contact", value: "Nothing provided", tone: "neutral", note: "No email or phone submitted." });
    }

    return {
      providerRef: "cont_" + hashInt("cref" + (input.email ?? "") + (input.phone ?? "")).toString(16),
      status: "pass",
      cautionLevel: caution,
      flags,
    };
  }
}
