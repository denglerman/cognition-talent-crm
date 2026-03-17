"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Clock, Loader2 } from "lucide-react";
import SearchBar from "./SearchBar";
import FilterBar from "./FilterBar";
import ThisWeek from "./ThisWeek";
import NeedsAttention from "./NeedsAttention";
import CandidateTable from "./CandidateTable";
import CandidateForm from "./CandidateForm";
import { createCandidate, batchUpdateCandidates } from "@/lib/actions";
import { addWeeks } from "@/lib/utils";
import type { Candidate, CandidateFormData, CandidateStatus } from "@/lib/types";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<
    | { type: "status"; value: CandidateStatus }
    | { type: "snooze" }
    | null
  >(null);
  const [isBatchUpdating, setIsBatchUpdating] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirmAction(null);
  };

  const toggleAll = () => {
    if (filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
    setConfirmAction(null);
  };

  const handleBatchConfirm = async () => {
    if (!confirmAction || selectedIds.size === 0) return;
    setIsBatchUpdating(true);
    try {
      const ids = Array.from(selectedIds);
      if (confirmAction.type === "status") {
        await batchUpdateCandidates(ids, { status: confirmAction.value });
      } else if (confirmAction.type === "snooze") {
        // Group candidates by status to apply correct snooze duration
        const candidateMap = new Map(candidates.map((c) => [c.id, c]));
        const warmIds = ids.filter((id) => candidateMap.get(id)?.status !== "cold");
        const coldIds = ids.filter((id) => candidateMap.get(id)?.status === "cold");
        if (warmIds.length > 0) {
          await batchUpdateCandidates(warmIds, {
            next_touchpoint_date: addWeeks(6),
          });
        }
        if (coldIds.length > 0) {
          await batchUpdateCandidates(coldIds, {
            next_touchpoint_date: addWeeks(12),
          });
        }
      }
      setSelectedIds(new Set());
      setConfirmAction(null);
      router.refresh();
    } catch (err) {
      console.error("Batch update failed:", err);
    } finally {
      setIsBatchUpdating(false);
    }
  };

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
      const created = await createCandidate(data);
      setShowForm(false);
      router.push(`/candidates/${created.id}`);
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
      <ThisWeek candidates={candidates} />
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
      <CandidateTable
        candidates={filtered}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
      />

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4">
          <div className="rounded-xl border border-zinc-700 bg-zinc-900/95 backdrop-blur-md shadow-2xl p-4">
            {confirmAction ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">
                  {confirmAction.type === "status"
                    ? `Set ${selectedIds.size} candidate${selectedIds.size > 1 ? "s" : ""} to ${confirmAction.value}?`
                    : `Snooze ${selectedIds.size} candidate${selectedIds.size > 1 ? "s" : ""}? (6 weeks warm, 12 weeks cold)`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBatchConfirm}
                    disabled={isBatchUpdating}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {isBatchUpdating ? (
                      <><Loader2 size={12} className="animate-spin" /> Updating...</>
                    ) : (
                      "Confirm"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-zinc-200">
                  {selectedIds.size} selected
                </span>
                <div className="flex items-center gap-2">
                  {(["cold", "warm", "ready"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setConfirmAction({ type: "status", value: s })}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      {s === "cold" ? "\u{1F534}" : s === "warm" ? "\u{1F7E1}" : "\u{1F7E2}"}{" "}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                  <button
                    onClick={() => setConfirmAction({ type: "snooze" })}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors flex items-center gap-1"
                  >
                    <Clock size={12} /> Snooze
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIds(new Set());
                      setConfirmAction(null);
                    }}
                    className="rounded-lg border border-zinc-700 px-2 py-1.5 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors"
                    title="Dismiss selection"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
