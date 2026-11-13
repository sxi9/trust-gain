"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ConsentGate from "@/components/ConsentGate";
import TrustCard, { type CardData } from "@/components/TrustCard";

interface State {
  deal: {
    id: string;
    title: string;
    description: string;
    roughValue: number;
    currency: string;
    requiresPayment: boolean;
    status: string;
    escrowStatus: string;
    inviteToken?: string;
  };
  me: {
    id: string;
    role: string;
    displayName: string | null;
    statedCountry: string | null;
    status: string;
    consents: string[];
    card: CardData;
  } | null;
  counterpart: { present: boolean; status?: string; card?: CardData | null };
  revealed: boolean;
  consentCatalog: { category: string; title: string; biometric: boolean; disclosure: string }[];
  needsJoin: boolean;
}

async function post(url: string, body?: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export default function DealClient({ dealId }: { dealId: string }) {
  const [state, setState] = useState<State | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}`, { cache: "no-store" });
    if (res.ok) setState(await res.json());
  }, [dealId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setInvite(params.get("invite"));
    load();
    pollRef.current = setInterval(load, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  async function guard(fn: () => Promise<void>) {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <main className="mx-auto max-w-2xl px-4 py-10 text-muted">Loading…</main>;

  const { deal, me, counterpart, revealed, consentCatalog } = state;

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <a href="/" className="text-brand text-sm">← TrustGain</a>
        <h1 className="text-2xl font-bold mt-2">{deal.title}</h1>
        <div className="text-muted text-sm mt-1">
          {deal.requiresPayment ? `${deal.roughValue} ${deal.currency} · escrow enabled` : "No payment"} ·{" "}
          status: {deal.status}
        </div>
        {deal.description && <p className="text-muted text-sm mt-2">{deal.description}</p>}
        {err && <div className="text-bad text-sm mt-4">{err}</div>}
        <div className="mt-6">{children}</div>
      </main>
    );
  }

  // ---- Join flow ----
  if (state.needsJoin || !me) {
    if (!invite) {
      return (
        <Shell>
          <div className="card p-5 text-muted">
            You do not have access to this deal. Ask the person who created it for their invite link.
          </div>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="card p-5">
          <h2 className="font-semibold mb-3">Join this trust check</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              guard(async () => {
                await post(`/api/deals/${dealId}/join`, {
                  inviteToken: invite,
                  displayName: f.get("displayName"),
                  statedCountry: f.get("statedCountry"),
                });
                await load();
              });
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="dn">Your name (shown after reveal)</label>
              <input id="dn" name="displayName" placeholder="e.g. Sam" className="mt-1" />
            </div>
            <div>
              <label htmlFor="sc">Your country (2-letter)</label>
              <input id="sc" name="statedCountry" placeholder="US" maxLength={2} className="mt-1" />
            </div>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Joining…" : "Join"}
            </button>
          </form>
        </div>
      </Shell>
    );
  }

  const inviteUrl =
    me.role === "creator" && deal.inviteToken
      ? `${window.location.origin}/deal/${deal.id}?invite=${deal.inviteToken}`
      : null;

  const InviteBox = () =>
    inviteUrl && !counterpart.present ? (
      <div className="card p-4 mb-6">
        <div className="font-semibold text-sm mb-1">Send this link to the other person</div>
        <div className="flex gap-2">
          <input readOnly value={inviteUrl} />
          <button
            className="btn"
            onClick={() => {
              navigator.clipboard?.writeText(inviteUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="text-muted text-xs mt-2">They verify through the same flow. You both reveal together.</div>
      </div>
    ) : null;

  // ---- Reveal ----
  if (revealed && me.card && counterpart.card) {
    return (
      <Shell>
        <div className="grid sm:grid-cols-2 gap-4">
          <TrustCard title="You" card={me.card} />
          <TrustCard title="The other person" card={counterpart.card} />
        </div>

        {deal.requiresPayment && (
          <div className="card p-4 mt-5">
            <div className="font-semibold text-sm mb-2">Payment protection</div>
            <div className="text-muted text-sm mb-3">
              Escrow status: <span className="text-white">{deal.escrowStatus}</span>. Funds are held by the
              licensed provider, never by TrustGain.
            </div>
            <div className="flex flex-wrap gap-2">
              {deal.escrowStatus === "none" && (
                <button className="btn btn-primary" disabled={busy} onClick={() => guard(async () => { await post(`/api/deals/${dealId}/escrow`, { action: "hold" }); await load(); })}>
                  Secure funds in escrow
                </button>
              )}
              {deal.escrowStatus === "held" && (
                <>
                  <button className="btn btn-primary" disabled={busy} onClick={() => guard(async () => { await post(`/api/deals/${dealId}/escrow`, { action: "release" }); await load(); })}>
                    Release to seller
                  </button>
                  <button className="btn" disabled={busy} onClick={() => guard(async () => { await post(`/api/deals/${dealId}/escrow`, { action: "refund" }); await load(); })}>
                    Refund buyer
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="card p-4 mt-5 text-muted text-sm">
          These are risk indicators to discuss, not verdicts. If anything looks off, you can walk away. A
          verified identity attests who someone is, not their intent.
        </div>
      </Shell>
    );
  }

  // ---- Waiting ----
  if (me.status === "complete") {
    return (
      <Shell>
        <InviteBox />
        <div className="card p-6 text-center">
          <div className="text-good font-semibold">You are verified.</div>
          <div className="text-muted text-sm mt-2">
            Waiting for the other person to finish. The results reveal to both of you at the same moment.
          </div>
          <div className="text-muted text-xs mt-3">
            Other side: {counterpart.present ? counterpart.status : "not joined yet"}
          </div>
        </div>
      </Shell>
    );
  }

  // ---- Consent gate ----
  if (me.consents.length === 0) {
    return (
      <Shell>
        <InviteBox />
        <ConsentGate
          catalog={consentCatalog}
          requiresPayment={deal.requiresPayment}
          busy={busy}
          onConsent={(items) =>
            guard(async () => {
              await post(`/api/deals/${dealId}/consent`, { consents: items });
              await load();
            })
          }
        />
      </Shell>
    );
  }

  // ---- Steps ----
  const resultFor = (kind: string) => me.card.results.find((r) => r.kind === kind);
  const required = me.consents.filter((c) => c !== "payment");
  const allPass = required.every((c) => resultFor(c)?.status === "pass");

  return (
    <Shell>
      <InviteBox />
      <div className="space-y-4">
        {me.consents.includes("connection") && (
          <StepCard title="Connection & device" done={resultFor("connection")?.status === "pass"}>
            {resultFor("connection") ? (
              <ResultFlags result={resultFor("connection")} />
            ) : (
              <button className="btn btn-primary" disabled={busy} onClick={() => guard(async () => { await post(`/api/deals/${dealId}/verify/connection`); await load(); })}>
                Run connection check
              </button>
            )}
          </StepCard>
        )}

        {me.consents.includes("contact") && (
          <StepCard title="Email & phone" done={resultFor("contact")?.status === "pass"}>
            {resultFor("contact") ? (
              <ResultFlags result={resultFor("contact")} />
            ) : (
              <form
                className="flex flex-col sm:flex-row gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  guard(async () => {
                    await post(`/api/deals/${dealId}/verify/contact`, { email: f.get("email"), phone: f.get("phone") });
                    await load();
                  });
                }}
              >
                <input name="email" placeholder="you@email.com" />
                <input name="phone" placeholder="+1 555 0100" />
                <button className="btn btn-primary" disabled={busy}>Verify</button>
              </form>
            )}
          </StepCard>
        )}

        {me.consents.includes("identity") && (
          <StepCard title="Government ID & liveness" done={resultFor("identity")?.status === "pass"}>
            {resultFor("identity")?.status === "pass" ? (
              <div className="text-good text-sm">Verified · {resultFor("identity")?.summary?.verifiedName}</div>
            ) : (
              <div>
                {resultFor("identity")?.status === "fail" && (
                  <div className="text-bad text-sm mb-2">Last attempt did not verify. Try again.</div>
                )}
                <button
                  className="btn btn-primary"
                  disabled={busy}
                  onClick={() =>
                    guard(async () => {
                      const data = await post(`/api/deals/${dealId}/verify/identity`);
                      window.location.href = data.redirectUrl;
                    })
                  }
                >
                  Start ID verification
                </button>
              </div>
            )}
          </StepCard>
        )}

        <div className="card p-4 flex items-center justify-between">
          <div className="text-sm text-muted">
            {allPass ? "All your checks passed." : "Complete each check you consented to."}
          </div>
          <button
            className="btn btn-primary"
            disabled={busy || !allPass}
            onClick={() => guard(async () => { await post(`/api/deals/${dealId}/complete`); await load(); })}
          >
            I&apos;m done
          </button>
        </div>
      </div>
    </Shell>
  );
}

function StepCard({ title, done, children }: { title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-sm">{title}</div>
        {done && <span className="text-good text-xs">✓ done</span>}
      </div>
      {children}
    </div>
  );
}

function ResultFlags({ result }: { result: any }) {
  const flags = result?.summary?.flags || [];
  return (
    <div className="space-y-1">
      {flags.map((f: any, i: number) => (
        <div key={i} className="flex justify-between text-sm">
          <span className="text-muted">{f.label}</span>
          <span className={f.tone === "caution" ? "text-warn" : "text-good"}>{f.value}</span>
        </div>
      ))}
    </div>
  );
}
