"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Calendar, Snowflake, UserPlus } from "lucide-react";
import StatusBadge from "./StatusBadge";
import type { Candidate } from "@/lib/types";

function isWithinNextDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false;
  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  const date = new Date(dateOnly + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = new Date(today);
  future.setDate(future.getDate() + days);
  return date >= today && date <= future;
}

function isWithinLastDays(dateStr: string | null, days: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - days);
  return date >= past && date <= now;
}

function CandidateRow({ candidate }: { candidate: Candidate }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <Link
        href={`/candidates/${candidate.id}`}
        className="text-sm text-zinc-200 hover:text-indigo-400 transition-colors truncate"
      >
        {candidate.full_name}
      </Link>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-zinc-500 hidden sm:inline">
          {candidate.current_company}
        </span>
        <StatusBadge status={candidate.status} size="sm" />
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          {title}
        </h3>
        <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-400">
          {count}
        </span>
      </div>
      <div className="pl-5 space-y-0.5">{children}</div>
    </div>
  );
}

export default function ThisWeek({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const dueThisWeek = candidates.filter((c) =>
    isWithinNextDays(c.next_touchpoint_date, 7)
  );

  const goneCold = candidates.filter(
    (c) => c.status === "cold" && isWithinLastDays(c.status_updated_at, 7)
  );

  const newCandidates = candidates.filter((c) =>
    isWithinLastDays(c.created_at, 7)
  );

  const totalCount = dueThisWeek.length + goneCold.length + newCandidates.length;

  if (totalCount === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
            This Week
          </h2>
          <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-400">
            {totalCount}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} className="text-zinc-500" />
        ) : (
          <ChevronDown size={16} className="text-zinc-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-5 space-y-5 border-t border-zinc-800 pt-4">
          <Section
            icon={<Calendar size={14} className="text-amber-400" />}
            title="Due This Week"
            count={dueThisWeek.length}
          >
            {dueThisWeek.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </Section>

          <Section
            icon={<Snowflake size={14} className="text-blue-400" />}
            title="Gone Cold"
            count={goneCold.length}
          >
            {goneCold.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </Section>

          <Section
            icon={<UserPlus size={14} className="text-green-400" />}
            title="New Candidates Added"
            count={newCandidates.length}
          >
            {newCandidates.map((c) => (
              <CandidateRow key={c.id} candidate={c} />
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
