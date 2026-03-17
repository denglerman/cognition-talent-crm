"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, ChevronDown, Sparkles, Copy, Check, X, RefreshCw } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import TouchpointLog from "@/components/TouchpointLog";
import TouchpointTimeline from "@/components/TouchpointTimeline";
import CandidateForm from "@/components/CandidateForm";
import {
  updateCandidate,
  deleteCandidate,
  createTouchpoint,
  generateOutreachEmail,
  generateWhyReachOut,
} from "@/lib/actions";
import {
  formatDate,
  getFunctionLabel,
  getChannelLabel,
} from "@/lib/utils";
import type {
  Candidate,
  Touchpoint,
  CandidateFormData,
  CandidateStatus,
} from "@/lib/types";

function truncateUrl(url: string, maxLength = 40): string {
  try {
    if (url.length <= maxLength) return url;
    const parsed = new URL(url);
    const path = parsed.pathname + parsed.search;
    const short = parsed.hostname + (path.length > 20 ? path.slice(0, 17) + "..." : path);
    return short.length <= maxLength ? short : short.slice(0, maxLength - 3) + "...";
  } catch {
    return url.length <= maxLength ? url : url.slice(0, maxLength - 3) + "...";
  }
}

function InfoItem({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string | null;
  isLink?: boolean;
}) {
  return (
    <div>
      <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1">
        {label}
      </h3>
      {value && isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          title={value}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors truncate block"
        >
          {truncateUrl(value)}
        </a>
      ) : (
        <p className="text-sm text-zinc-300">{value || "—"}</p>
      )}
    </div>
  );
}

export default function CandidateDetailClient({
  candidate: initialCandidate,
  touchpoints: initialTouchpoints,
}: {
  candidate: Candidate;
  touchpoints: Touchpoint[];
}) {
  const router = useRouter();
  const [candidate, setCandidate] = useState(initialCandidate);
  const [touchpoints, setTouchpoints] = useState(initialTouchpoints);
  const [showEditForm, setShowEditForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachEmail, setOutreachEmail] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "table">("timeline");
  const [whyReachOut, setWhyReachOut] = useState<string | null>(null);
  const [isGeneratingWhy, setIsGeneratingWhy] = useState(false);

  const handleGenerateWhyReachOut = useCallback(async () => {
    if (!candidate.signals) return;
    setIsGeneratingWhy(true);
    try {
      const result = await generateWhyReachOut(candidate.signals);
      setWhyReachOut(result);
    } catch {
      setWhyReachOut(null);
    } finally {
      setIsGeneratingWhy(false);
    }
  }, [candidate.signals]);

  useEffect(() => {
    if (candidate.signals) {
      handleGenerateWhyReachOut();
    } else {
      setWhyReachOut(null);
    }
  }, [candidate.signals, handleGenerateWhyReachOut]);

  const handleUpdateStatus = async (status: CandidateStatus) => {
    try {
      const updated = await updateCandidate(candidate.id, { status });
      setCandidate(updated);
      setShowStatusMenu(false);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleEdit = async (data: CandidateFormData) => {
    setIsSubmitting(true);
    try {
      const updated = await updateCandidate(candidate.id, data);
      setCandidate(updated);
      setShowEditForm(false);
    } catch (err) {
      console.error("Failed to update candidate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCandidate(candidate.id);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete candidate:", err);
    }
  };

  const handleGenerateOutreach = async () => {
    setShowOutreach(true);
    setIsGenerating(true);
    setOutreachEmail("");
    setCopied(false);
    try {
      const email = await generateOutreachEmail({
        full_name: candidate.full_name,
        current_company: candidate.current_company,
        current_role: candidate.current_role,
        status: candidate.status,
        trigger_notes: candidate.trigger_notes,
        warm_path: candidate.warm_path,
        notes: candidate.notes,
        last_touch_date: candidate.last_touch_date,
        last_touch_channel: candidate.last_touch_channel,
        touchpoints: touchpoints.map((tp) => ({
          date: tp.date,
          channel: tp.channel,
          notes: tp.notes,
        })),
      });
      setOutreachEmail(email ?? "Failed to generate email. Please try again.");
    } catch {
      setOutreachEmail("Failed to generate email. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyOutreach = async () => {
    await navigator.clipboard.writeText(outreachEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddTouchpoint = async (data: {
    date: string;
    channel: string;
    notes: string;
  }) => {
    const tp = await createTouchpoint({
      candidate_id: candidate.id,
      date: data.date,
      channel: data.channel,
      notes: data.notes || undefined,
    });
    setTouchpoints((prev) => [tp, ...prev]);
    setCandidate((prev) => ({
      ...prev,
      last_touch_date: data.date,
      last_touch_channel: data.channel as Candidate["last_touch_channel"],
    }));
  };

  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
      >
        <ArrowLeft size={16} /> Back to pipeline
      </Link>

      {candidate.status === "ready" && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
          <p className="text-sm font-medium text-green-400">
            🟢 This candidate is ready — loop in Patrick
          </p>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {candidate.full_name}
            </h1>
            <p className="text-zinc-400 mt-1">
              {candidate.current_role} @ {candidate.current_company}
            </p>
            {candidate.signals && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5">
                  {isGeneratingWhy ? (
                    <span className="text-xs text-amber-300/70 animate-pulse">Generating insight...</span>
                  ) : whyReachOut ? (
                    <span className="text-xs font-medium text-amber-300">{whyReachOut}</span>
                  ) : (
                    <span className="text-xs text-amber-300/50">Could not generate insight</span>
                  )}
                </div>
                <button
                  onClick={handleGenerateWhyReachOut}
                  disabled={isGeneratingWhy}
                  className="text-amber-400/60 hover:text-amber-300 transition-colors disabled:opacity-40"
                  title="Regenerate"
                >
                  <RefreshCw size={14} className={isGeneratingWhy ? "animate-spin" : ""} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={candidate.status} />
              <span className="text-sm text-zinc-500">
                {getFunctionLabel(candidate.function)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors flex items-center gap-1"
              >
                Update Status <ChevronDown size={14} />
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 mt-1 w-40 rounded-lg border border-zinc-700 bg-zinc-800 shadow-xl z-10">
                  {(["cold", "warm", "ready"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleUpdateStatus(s)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-zinc-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                        candidate.status === s
                          ? "text-indigo-400"
                          : "text-zinc-300"
                      }`}
                    >
                      {s === "cold" ? "🔴" : s === "warm" ? "🟡" : "🟢"}{" "}
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateOutreach}
              className="rounded-lg border border-indigo-500/50 px-3 py-2 text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400 transition-colors flex items-center gap-1"
            >
              <Sparkles size={14} /> Generate Outreach
            </button>
            <button
              onClick={() => setShowEditForm(true)}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors flex items-center gap-1"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-lg border border-red-700/50 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:border-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 pt-6 border-t border-zinc-800">
          <InfoItem label="LinkedIn" value={candidate.linkedin_url} isLink />
          <InfoItem label="Ashby ATS" value={candidate.ashby_url} isLink />
          <InfoItem label="Email" value={candidate.email} />
          <InfoItem label="Phone" value={candidate.phone} />
          <InfoItem
            label="Last Touch"
            value={
              candidate.last_touch_date
                ? `${formatDate(candidate.last_touch_date)}${candidate.last_touch_channel ? ` (${getChannelLabel(candidate.last_touch_channel)})` : ""}`
                : null
            }
          />
          <InfoItem
            label="Next Touchpoint"
            value={formatDate(candidate.next_touchpoint_date)}
          />
          <InfoItem
            label="Created"
            value={formatDate(candidate.created_at)}
          />
        </div>

        {candidate.warm_path && (
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Warm Path
            </h3>
            <p className="text-sm text-zinc-300">{candidate.warm_path}</p>
          </div>
        )}

        {candidate.signals && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Signals
            </h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{candidate.signals}</p>
          </div>
        )}

        {candidate.trigger_notes && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Trigger Notes
            </h3>
            <p className="text-sm text-zinc-300">{candidate.trigger_notes}</p>
          </div>
        )}

        {candidate.notes && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
              Notes
            </h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {candidate.notes}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 rounded-lg bg-zinc-800/80 p-1">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "timeline"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Timeline
            </button>
            <button
              onClick={() => setActiveTab("table")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {activeTab === "timeline" ? (
          <TouchpointTimeline touchpoints={touchpoints} />
        ) : (
          <TouchpointLog touchpoints={touchpoints} onAdd={handleAddTouchpoint} />
        )}

        {activeTab === "timeline" && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <TouchpointLog touchpoints={[]} onAdd={handleAddTouchpoint} />
          </div>
        )}
      </div>

      {showEditForm && (
        <CandidateForm
          candidate={candidate}
          onSubmit={handleEdit}
          onClose={() => setShowEditForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {showOutreach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg mx-4 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" /> AI Outreach Email
              </h3>
              <button
                onClick={() => setShowOutreach(false)}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p className="text-sm text-zinc-400">Generating personalized outreach...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 max-h-80 overflow-y-auto">
                  <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {outreachEmail}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={handleGenerateOutreach}
                    className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-colors flex items-center gap-1"
                  >
                    <Sparkles size={14} /> Regenerate
                  </button>
                  <button
                    onClick={handleCopyOutreach}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors flex items-center gap-1"
                  >
                    {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Delete Candidate
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              Are you sure you want to delete {candidate.full_name}? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
