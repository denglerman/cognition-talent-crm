"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate, getFunctionLabel, getChannelLabel } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

export default function CandidateTable({
  candidates,
  selectedIds,
  onToggleSelect,
  onToggleAll,
}: {
  candidates: Candidate[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center">
        <p className="text-zinc-500">No candidates found.</p>
      </div>
    );
  }

  const allSelected =
    candidates.length > 0 && candidates.every((c) => selectedIds.has(c.id));
  const someSelected =
    candidates.some((c) => selectedIds.has(c.id)) && !allSelected;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onChange={onToggleAll}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
                />
              </th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company / Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Function</th>
              <th className="px-4 py-3 font-medium">Last Touch</th>
              <th className="px-4 py-3 font-medium">Next Touchpoint</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
              <tr
                key={c.id}
                className={`border-b border-zinc-800/50 transition-colors ${
                  isSelected ? "bg-indigo-500/10" : "hover:bg-zinc-800/30"
                }`}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(c.id)}
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/candidates/${c.id}`}
                    className="font-medium text-zinc-100 hover:text-indigo-400 transition-colors"
                  >
                    {c.full_name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="text-zinc-200">{c.current_company}</div>
                  <div className="text-xs text-zinc-500">{c.current_role}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={c.status} size="sm" />
                </td>
                <td className="px-4 py-3 text-zinc-400">
                  {getFunctionLabel(c.function)}
                </td>
                <td className="px-4 py-3">
                  <div className="text-zinc-300">
                    {formatDate(c.last_touch_date)}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {getChannelLabel(c.last_touch_channel)}
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-300">
                  {formatDate(c.next_touchpoint_date)}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {candidates.map((c) => {
          const isSelected = selectedIds.has(c.id);
          return (
          <div
            key={c.id}
            className={`rounded-xl border bg-zinc-900/50 p-4 transition-colors ${
              isSelected
                ? "border-indigo-500/50 bg-indigo-500/10"
                : "border-zinc-800 hover:bg-zinc-800/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(c.id)}
                className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
              />
              <Link
                href={`/candidates/${c.id}`}
                className="flex-1"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-100">{c.full_name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {c.current_role} @ {c.current_company}
                    </p>
                  </div>
                  <StatusBadge status={c.status} size="sm" />
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
                  <span>{getFunctionLabel(c.function)}</span>
                  <span>Last: {formatDate(c.last_touch_date)}</span>
                  <span>Next: {formatDate(c.next_touchpoint_date)}</span>
                </div>
              </Link>
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
