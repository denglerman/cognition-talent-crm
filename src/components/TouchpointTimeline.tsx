"use client";

import { useState } from "react";
import { getChannelLabel, formatDate } from "@/lib/utils";
import type { Touchpoint } from "@/lib/types";

function ChannelIcon({ channel }: { channel: string }) {
  switch (channel) {
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      );
    case "text":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "event":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M8 2v4" /><path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
      );
  }
}

function getChannelColor(channel: string): string {
  switch (channel) {
    case "linkedin":
      return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "email":
      return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    case "text":
      return "bg-green-500/20 text-green-400 border-green-500/40";
    case "event":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
  }
}

function getNodeColor(channel: string): string {
  switch (channel) {
    case "linkedin":
      return "bg-blue-500 shadow-blue-500/30";
    case "email":
      return "bg-purple-500 shadow-purple-500/30";
    case "text":
      return "bg-green-500 shadow-green-500/30";
    case "event":
      return "bg-amber-500 shadow-amber-500/30";
    default:
      return "bg-zinc-500 shadow-zinc-500/30";
  }
}

export default function TouchpointTimeline({
  touchpoints,
}: {
  touchpoints: Touchpoint[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (touchpoints.length === 0) {
    return <p className="text-sm text-zinc-500 py-4">No touchpoints yet.</p>;
  }

  const sorted = [...touchpoints].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative pl-6">
      {/* Vertical spine */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-indigo-500/60 via-zinc-600/40 to-transparent" />

      <div className="space-y-1">
        {sorted.map((tp, index) => {
          const isExpanded = expandedId === tp.id;
          const hasNotes = tp.notes && tp.notes.trim().length > 0;
          const isLongNote = hasNotes && tp.notes!.length > 120;

          return (
            <div key={tp.id} className="relative group">
              {/* Circle node on the spine */}
              <div
                className={`absolute -left-6 top-3 h-[10px] w-[10px] rounded-full border-2 border-zinc-900 shadow-md ${getNodeColor(tp.channel)} ${index === 0 ? "ring-2 ring-indigo-500/30 ring-offset-1 ring-offset-zinc-900" : ""}`}
              />

              {/* Content card */}
              <button
                type="button"
                onClick={() => hasNotes && isLongNote ? setExpandedId(isExpanded ? null : tp.id) : undefined}
                className={`w-full text-left rounded-lg px-4 py-3 transition-all duration-200 ${
                  hasNotes && isLongNote ? "cursor-pointer" : "cursor-default"
                } hover:bg-zinc-800/50`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-zinc-200 tabular-nums whitespace-nowrap">
                    {formatDate(tp.date)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${getChannelColor(tp.channel)}`}
                  >
                    <ChannelIcon channel={tp.channel} />
                    {getChannelLabel(tp.channel)}
                  </span>
                </div>

                {hasNotes && (
                  <div className="mt-1.5">
                    <p
                      className={`text-sm text-zinc-400 leading-relaxed ${
                        !isExpanded && isLongNote ? "line-clamp-2" : ""
                      }`}
                    >
                      {tp.notes}
                    </p>
                    {isLongNote && (
                      <span className="mt-1 inline-block text-xs text-indigo-400 hover:text-indigo-300">
                        {isExpanded ? "Show less" : "Show more"}
                      </span>
                    )}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
