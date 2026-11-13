"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateDealForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresPayment, setRequiresPayment] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      displayName: form.get("displayName"),
      title: form.get("title"),
      description: form.get("description"),
      roughValue: Number(form.get("roughValue") || 0),
      currency: form.get("currency") || "USD",
      requiresPayment,
      statedCountry: form.get("statedCountry"),
    };
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the deal.");
      router.push(`/deal/${data.dealId}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="displayName">Your name (shown after reveal)</label>
          <input id="displayName" name="displayName" placeholder="e.g. Alex" className="mt-1" />
        </div>
        <div>
          <label htmlFor="statedCountry">Your country (2-letter)</label>
          <input id="statedCountry" name="statedCountry" placeholder="US" maxLength={2} className="mt-1" />
        </div>
      </div>
      <div>
        <label htmlFor="title">What is the deal?</label>
        <input id="title" name="title" required placeholder="Selling a used camera" className="mt-1" />
      </div>
      <div>
        <label htmlFor="description">Details (optional)</label>
        <textarea id="description" name="description" rows={2} placeholder="Meeting to hand over in person next week." className="mt-1" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="roughValue">Approx. value</label>
          <input id="roughValue" name="roughValue" type="number" min={0} step="1" placeholder="0" className="mt-1" />
        </div>
        <div>
          <label htmlFor="currency">Currency</label>
          <input id="currency" name="currency" placeholder="USD" maxLength={3} className="mt-1" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={requiresPayment} onChange={(e) => setRequiresPayment(e.target.checked)} />
        This deal involves money — offer escrow (funds held until both confirm)
      </label>

      {error && <div className="text-bad text-sm">{error}</div>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create deal & get invite link"}
      </button>
    </form>
  );
}
