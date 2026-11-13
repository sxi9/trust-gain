"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function IdvSimulator({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [session, setSession] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setSession(p.get("session") || "");
  }, []);

  async function resolve(outcome: "pass" | "fail") {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${params.id}/verify/identity/resolve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId: session, outcome }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      router.push(`/deal/${params.id}`);
    } catch (e: any) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="card p-6">
        <div className="text-brand text-xs font-bold tracking-wide">LICENSED IDENTITY PROVIDER (SIMULATED)</div>
        <h1 className="text-xl font-bold mt-1">Verify your identity</h1>
        <p className="text-muted text-sm mt-3 leading-relaxed">
          In the real product this is the provider&apos;s own hosted page (e.g. Stripe Identity). Your
          ID photo and liveness selfie are captured here and uploaded <strong>directly to the provider</strong>.
          They never pass through or get stored by TrustGain. TrustGain receives only a pass/fail plus your
          verified name and country.
        </p>
        <div className="text-muted text-xs mt-3">Session: {session || "—"}</div>

        {err && <div className="text-bad text-sm mt-3">{err}</div>}

        <div className="flex gap-2 mt-5">
          <button className="btn btn-primary" disabled={busy || !session} onClick={() => resolve("pass")}>
            Simulate successful verification
          </button>
          <button className="btn" disabled={busy || !session} onClick={() => resolve("fail")}>
            Simulate failure
          </button>
        </div>
      </div>
    </main>
  );
}
