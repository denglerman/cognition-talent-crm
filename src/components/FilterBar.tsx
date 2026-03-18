"use client";

import { ArrowUpDown } from "lucide-react";

export default function FilterBar({
  statusFilter,
  functionFilter,
  sortBy,
  sortOrder,
  onStatusChange,
  onFunctionChange,
  onSortChange,
  onSortOrderToggle,
}: {
  statusFilter: string;
  functionFilter: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onStatusChange: (v: string) => void;
  onFunctionChange: (v: string) => void;
  onSortChange: (v: string) => void;
  onSortOrderToggle: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500/50"
      >
        <option value="">All Statuses</option>
        <option value="cold">🔴 Cold</option>
        <option value="warm">🟡 Warm</option>
        <option value="hot">🟢 Hot</option>
      </select>

      <select
        value={functionFilter}
        onChange={(e) => onFunctionChange(e.target.value)}
        className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500/50"
      >
        <option value="">All Functions</option>
        <option value="engineering">Engineering</option>
        <option value="product">Product</option>
        <option value="gtm">GTM</option>
        <option value="other">Other</option>
      </select>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-zinc-500">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none focus:border-indigo-500/50"
        >
          <option value="next_touchpoint_date">Next Touchpoint</option>
          <option value="last_touch_date">Last Touch</option>
          <option value="status">Status</option>
          <option value="full_name">Name</option>
        </select>
        <button
          onClick={onSortOrderToggle}
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
          className="rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
        >
          <ArrowUpDown size={14} />
        </button>
      </div>
    </div>
  );
}
