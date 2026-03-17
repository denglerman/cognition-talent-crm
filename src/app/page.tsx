import { getCandidates } from "@/lib/actions";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const candidates = await getCandidates();
  return <Dashboard candidates={candidates} />;
}
