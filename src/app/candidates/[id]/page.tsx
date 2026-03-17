import { getCandidate, getTouchpoints, getEmailDrafts } from "@/lib/actions";
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
  let emailDrafts;
  try {
    [candidate, touchpoints, emailDrafts] = await Promise.all([
      getCandidate(id),
      getTouchpoints(id),
      getEmailDrafts(id),
    ]);
  } catch {
    notFound();
  }

  return (
    <CandidateDetailClient
      candidate={candidate}
      touchpoints={touchpoints}
      emailDrafts={emailDrafts}
    />
  );
}
