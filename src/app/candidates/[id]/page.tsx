import { getCandidate, getTouchpoints } from "@/lib/actions";
import CandidateDetailClient from "./CandidateDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let candidate;
  let touchpoints;
  try {
    [candidate, touchpoints] = await Promise.all([
      getCandidate(id),
      getTouchpoints(id),
    ]);
  } catch {
    notFound();
  }

  return (
    <CandidateDetailClient
      candidate={candidate}
      touchpoints={touchpoints}
    />
  );
}
