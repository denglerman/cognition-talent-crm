import { getQueueCandidates } from "@/lib/actions";
import QueueClient from "./QueueClient";

export const dynamic = "force-dynamic";

export default async function QueuePage() {
  const candidates = await getQueueCandidates();
  return <QueueClient candidates={candidates} />;
}
