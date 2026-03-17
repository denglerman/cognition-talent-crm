"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RotateCcw, Copy, Check, ArrowLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import {
  generateOutreachEmail,
  saveEmailDraft,
  createTouchpoint,
  updateCandidate,
} from "@/lib/actions";
import { formatDate, getChannelLabel } from "@/lib/utils";
import type { Candidate } from "@/lib/types";

function addDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

export default function QueueClient({
  candidates,
}: {
  candidates: Candidate[];
}) {
  const [index, setIndex] = useState(0);
  const [touchedCount, setTouchedCount] = useState(0);
  const [done, setDone] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const total = candidates.length;
  const candidate = candidates[index];

  // Auto-generate email when card changes
  const generateEmail = useCallback(async (c: Candidate) => {
    setEmail(null);
    setIsGenerating(true);
    setCopied(false);
    try {
      const result = await generateOutreachEmail({
        full_name: c.full_name,
        current_company: c.current_company,
        current_role: c.current_role,
        status: c.status,
        trigger_notes: c.trigger_notes,
        warm_path: c.warm_path,
        notes: c.notes,
        last_touch_date: c.last_touch_date,
        last_touch_channel: c.last_touch_channel,
        touchpoints: [],
      });
      setEmail(result);
      if (result) {
        try {
          await saveEmailDraft({ candidate_id: c.id, body: result });
        } catch {
          // silent
        }
      }
    } catch {
      setEmail(null);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (candidate) {
      generateEmail(candidate);
    }
  }, [candidate, generateEmail]);

  const advance = useCallback(() => {
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  }, [index, total]);

  const handleSend = useCallback(async () => {
    if (!candidate) return;
    if (email) {
      await navigator.clipboard.writeText(email);
      setCopied(true);
    }
    try {
      await createTouchpoint({
        candidate_id: candidate.id,
        date: new Date().toISOString().split("T")[0],
        channel: "email",
        notes: "Outreach email sent via Queue",
      });
    } catch {
      // silent
    }
    setTouchedCount((n) => n + 1);
    setTimeout(() => {
      setCopied(false);
      advance();
    }, 600);
  }, [candidate, email, advance]);

  const handleSnooze = useCallback(async () => {
    if (!candidate) return;
    try {
      await updateCandidate(candidate.id, {
        next_touchpoint_date: addDays(21),
      });
    } catch {
      // silent
    }
    advance();
  }, [candidate, advance]);

  const handleSkip = useCallback(() => {
    advance();
  }, [advance]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      switch (e.key.toLowerCase()) {
        case "s":
          handleSend();
          break;
        case "z":
          handleSnooze();
          break;
        case "x":
          handleSkip();
          break;
        case " ":
        case "arrowright":
          e.preventDefault();
          handleSkip();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSend, handleSnooze, handleSkip]);

  // Done / empty state
  if (done || total === 0) {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center text-center px-6">
        <div className="text-5xl mb-6">✦</div>
        <h1 className="text-3xl font-bold text-white mb-2">You&apos;re clear</h1>
        <p className="text-zinc-400 text-lg mb-1">{today}</p>
        {touchedCount > 0 && (
          <p className="text-zinc-500 text-sm mt-1">
            {touchedCount} candidate{touchedCount !== 1 ? "s" : ""} touched this session
          </p>
        )}
        <Link
          href="/"
          className="mt-8 flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft size={14} /> Back to pipeline
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      {/* Back link */}
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <ArrowLeft size={12} /> Pipeline
        </Link>
      </div>

      {/* Progress */}
      <p className="text-xs text-zinc-500 mb-6 tracking-wide uppercase">
        {index + 1} of {total} due
      </p>

      {/* Card */}
      <div className="w-full max-w-[580px] rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white leading-tight">
              {candidate.full_name}
            </h1>
            <StatusBadge status={candidate.status} />
          </div>
          <p className="text-zinc-400 text-sm">
            {candidate.current_role} @ {candidate.current_company}
          </p>
          {candidate.last_touch_date && (
            <p className="text-zinc-600 text-xs mt-1">
              Last touch: {formatDate(candidate.last_touch_date)}
              {candidate.last_touch_channel
                ? ` via ${getChannelLabel(candidate.last_touch_channel)}`
                : ""}
            </p>
          )}
        </div>

        {/* Trigger notes */}
        {candidate.trigger_notes && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              Trigger Notes
            </p>
            <p className="text-sm text-zinc-300">{candidate.trigger_notes}</p>
          </div>
        )}

        {/* Warm path */}
        {candidate.warm_path && (
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
              Warm Path
            </p>
            <p className="text-sm text-zinc-300">{candidate.warm_path}</p>
          </div>
        )}

        {/* AI email */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              Suggested Outreach
            </p>
            <button
              onClick={() => generateEmail(candidate)}
              disabled={isGenerating}
              className="text-zinc-600 hover:text-zinc-400 transition-colors disabled:opacity-40"
              title="Regenerate"
            >
              <RotateCcw size={13} className={isGenerating ? "animate-spin" : ""} />
            </button>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-4 min-h-[80px]">
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-xs text-zinc-500">Generating...</span>
              </div>
            ) : email ? (
              <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {email}
              </p>
            ) : (
              <p className="text-xs text-zinc-600">Could not generate email.</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-[580px] mt-4 grid grid-cols-3 gap-3">
        <button
          onClick={handleSend}
          className="flex flex-col items-center gap-1 rounded-xl border border-indigo-500/40 bg-indigo-600/20 px-4 py-3 text-indigo-300 hover:bg-indigo-600/30 hover:border-indigo-400 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Send"}
          </span>
          <span className="text-xs text-indigo-500">S</span>
        </button>
        <button
          onClick={handleSnooze}
          className="flex flex-col items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-300 hover:bg-zinc-700/50 hover:border-zinc-600 transition-colors"
        >
          <span className="text-sm font-medium">Snooze</span>
          <span className="text-xs text-zinc-600">Z · +21 days</span>
        </button>
        <button
          onClick={handleSkip}
          className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-400 transition-colors"
        >
          <span className="text-sm font-medium">Skip</span>
          <span className="text-xs text-zinc-700">X · Space · →</span>
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-xs text-zinc-700">
        Keyboard: S = Send · Z = Snooze · X / Space / → = Skip
      </p>
    </div>
  );
}
