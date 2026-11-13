import DealClient from "./DealClient";

export const dynamic = "force-dynamic";

export default function DealPage({ params }: { params: { id: string } }) {
  return <DealClient dealId={params.id} />;
}
