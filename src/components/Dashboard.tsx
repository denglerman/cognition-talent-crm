"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import NeedsAttention from "./NeedsAttention";
import CandidateTable from "./CandidateTable";
import CandidateForm from "./CandidateForm";
import { createCandidate } from "@/lib/actions";
import type { Candidate, CandidateFormData } from "@/lib/types";

export default function Dashboard({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [functionFilter, setFunctionFilter] = useState("");
  const [sortBy, setSortBy] = useState("next_touchpoint_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    let result = candidates;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.current_company.toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (functionFilter) {
      result = result.filter((c) => c.function === functionFilter);
    }

    const statusOrder: Record<string, number> = {
      ready: 0,
      warm: 1,
      cold: 2,
    };

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "status") {
        cmp = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
      } else if (sortBy === "full_name") {
        cmp = a.full_name.localeCompare(b.full_name);
      } else {
        const aVal = String(
          (a as unknown as Record<string, string>)[sortBy] || ""
        );
        const bVal = String(
          (b as unknown as Record<string, string>)[sortBy] || ""
        );
        cmp = aVal.localeCompare(bVal);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [candidates, search, statusFilter, functionFilter, sortBy, sortOrder]);

  const handleSubmit = async (data: CandidateFormData) => {
    setIsSubmitting(true);
    try {
      await createCandidate(data);
      setShowForm(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to create candidate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {candidates.length} candidates in your pipeline
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus size={16} /> Add Candidate
        </button>
      </div>

      <NeedsAttention candidates={candidates} />
      <SearchBar value={search} onChange={setSearch} />
      <FilterBar
        statusFilter={statusFilter}
        functionFilter={functionFilter}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onStatusChange={setStatusFilter}
        onFunctionChange={setFunctionFilter}
        onSortChange={setSortBy}
        onSortOrderToggle={() =>
          setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
        }
      />
      <CandidateTable candidates={filtered} />

      {showForm && (
        <CandidateForm
          onSubmit={handleSubmit}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
