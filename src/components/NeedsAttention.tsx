"use client";

import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate, isOverdue, isToday } from "@/lib/utils";
import type { Candidate } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

export default function NeedsAttention({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const attention = candidates.filter(
    (c) => isOverdue(c.next_touchpoint_date) || isToday(c.next_touchpoint_date)
  );

  if (attention.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-3">
        <AlertTriangle size={16} /> NEEDS ATTENTION ({attention.length})
      </h2>
      <div className="space-y-2">
        {attention.map((c) => (
          <Link
            key={c.id}
            href={`/candidates/${c.id}`}
            className="flex items-center justify-between rounded-lg bg-zinc-900/60 px-4 py-2.5 hover:bg-zinc-800/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <StatusBadge status={c.status} size="sm" />
              <span className="text-sm font-medium text-zinc-200">
                {c.full_name}
              </span>
              <span className="text-xs text-zinc-500">
                {c.current_role} @ {c.current_company}
              </span>
            </div>
            <span className="text-xs text-amber-400">
              {isToday(c.next_touchpoint_date)
                ? "Due today"
                : `Overdue — ${formatDate(c.next_touchpoint_date)}`}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
