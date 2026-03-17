"use client";

import { useState, useRef } from "react";
import { X, Link, Loader2, FileText, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { addWeeks } from "@/lib/utils";
import { parseLinkedInProfile, parseMeetingNotes } from "@/lib/actions";
import type { Candidate, CandidateFormData, CandidateStatus, CandidateFunction, TouchChannel } from "@/lib/types";

type AddModeInputs = {
  linkedinUrl: string;
  resumeFile: File | null;
  meetingNotes: string;
};

export default function CandidateForm({
  candidate,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  candidate?: Candidate;
  onSubmit: (data: CandidateFormData, meta?: { rawMeetingNotes?: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) {
  const isAddMode = !candidate;
  const [form, setForm] = useState<CandidateFormData>({
    full_name: candidate?.full_name ?? "",
    current_company: candidate?.current_company ?? "",
    current_role: candidate?.current_role ?? "",
    linkedin_url: candidate?.linkedin_url ?? "",
    email: candidate?.email ?? "",
    phone: candidate?.phone ?? "",
    status: candidate?.status ?? "cold",
    function: candidate?.function ?? "engineering",
    trigger_notes: candidate?.trigger_notes ?? "",
    warm_path: candidate?.warm_path ?? "",
    last_touch_date: candidate?.last_touch_date ?? "",
    last_touch_channel: candidate?.last_touch_channel ?? null,
    next_touchpoint_date: candidate?.next_touchpoint_date ?? "",
    notes: candidate?.notes ?? "",
    ashby_url: candidate?.ashby_url ?? "",
    signals: candidate?.signals ?? "",
    status_updated_at: candidate?.status_updated_at ?? new Date().toISOString(),
  });

  // Add mode inputs (raw, unparsed)
  const [addInputs, setAddInputs] = useState<AddModeInputs>({
    linkedinUrl: "",
    resumeFile: null,
    meetingNotes: "",
  });
  const [addError, setAddError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resumeFileName, setResumeFileName] = useState("");

  // Edit mode state for meeting notes
  const [meetingNotesText, setMeetingNotesText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [showMeetingNotes, setShowMeetingNotes] = useState(true);
  const [parseSuccess, setParseSuccess] = useState(false);

  const handleMeetingNotesParse = async () => {
    if (!meetingNotesText.trim()) return;
    setIsParsing(true);
    setParseError("");
    setParseSuccess(false);
    try {
      const result = await parseMeetingNotes(
        meetingNotesText,
        form.full_name || undefined
      );
      if (result) {
        setForm((f) => ({
          ...f,
          full_name: result.full_name || f.full_name,
          current_company: result.current_company || f.current_company,
          current_role: result.current_role || f.current_role,
          email: result.email || f.email,
          phone: result.phone || f.phone,
          linkedin_url: result.linkedin_url || f.linkedin_url,
          warm_path: result.warm_path || f.warm_path,
          trigger_notes: result.trigger_notes || f.trigger_notes,
          status: (["cold", "warm", "ready"].includes(result.status) ? result.status : f.status) as CandidateStatus,
          last_touch_date: result.last_touch_date || f.last_touch_date,
          last_touch_channel: (result.last_touch_channel || f.last_touch_channel) as TouchChannel | null,
          notes: meetingNotesText,
        }));
        setParseSuccess(true);
        setMeetingNotesText("");
      } else {
        setParseError("Could not extract information from the notes. Please try again.");
      }
    } catch {
      setParseError("Failed to parse meeting notes. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStatusChange = (status: CandidateStatus) => {
    const updates: Partial<CandidateFormData> = { status };
    if (status === "warm") updates.next_touchpoint_date = addWeeks(6);
    else if (status === "cold") updates.next_touchpoint_date = addWeeks(12);
    setForm((f) => ({ ...f, ...updates }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { linkedinUrl, resumeFile, meetingNotes } = addInputs;
    if (!linkedinUrl.trim() && !resumeFile && !meetingNotes.trim()) {
      setAddError("Please provide at least one input: LinkedIn URL, resume, or meeting notes.");
      return;
    }
    setIsProcessing(true);
    setAddError("");

    let merged: Partial<CandidateFormData> = {};

    // 1. Parse LinkedIn
    if (linkedinUrl.trim()) {
      try {
        const li = await parseLinkedInProfile(linkedinUrl);
        if (li) {
          merged.full_name = li.full_name || merged.full_name;
          merged.current_company = li.current_company || merged.current_company;
          merged.current_role = li.current_role || merged.current_role;
          merged.linkedin_url = li.linkedin_url || merged.linkedin_url;
        }
      } catch { /* continue */ }
    }

    // 2. Parse resume
    if (resumeFile) {
      try {
        const fd = new FormData();
        fd.append("file", resumeFile);
        const res = await fetch("/api/parse-resume", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          merged.full_name = data.full_name || merged.full_name;
          merged.current_company = data.current_company || merged.current_company;
          merged.current_role = data.current_role || merged.current_role;
          merged.email = data.email || merged.email;
          merged.phone = data.phone || merged.phone;
          merged.linkedin_url = data.linkedin_url || merged.linkedin_url;
          merged.notes = data.notes || merged.notes;
        }
      } catch { /* continue */ }
    }

    // 3. Parse meeting notes
    if (meetingNotes.trim()) {
      try {
        const mn = await parseMeetingNotes(meetingNotes, merged.full_name || undefined);
        if (mn) {
          merged.full_name = mn.full_name || merged.full_name;
          merged.current_company = mn.current_company || merged.current_company;
          merged.current_role = mn.current_role || merged.current_role;
          merged.email = mn.email || merged.email;
          merged.phone = mn.phone || merged.phone;
          merged.linkedin_url = mn.linkedin_url || merged.linkedin_url;
          merged.warm_path = mn.warm_path || merged.warm_path;
          merged.trigger_notes = mn.trigger_notes || merged.trigger_notes;
          if (["cold", "warm", "ready"].includes(mn.status)) {
            merged.status = mn.status as CandidateStatus;
          }
          merged.last_touch_date = mn.last_touch_date || merged.last_touch_date;
          merged.last_touch_channel = (mn.last_touch_channel || merged.last_touch_channel) as TouchChannel | null;
          // Full raw notes go into notes field
          merged.notes = meetingNotes;
        }
      } catch { /* continue */ }
    }

    // Build final form data
    const finalForm: CandidateFormData = {
      ...form,
      ...merged,
    };
    const data = {
      ...finalForm,
      email: finalForm.email || null,
      phone: finalForm.phone || null,
      trigger_notes: finalForm.trigger_notes || null,
      warm_path: finalForm.warm_path || null,
      last_touch_date: finalForm.last_touch_date || null,
      last_touch_channel: finalForm.last_touch_channel || null,
      next_touchpoint_date: finalForm.next_touchpoint_date || null,
      notes: finalForm.notes || null,
      ashby_url: finalForm.ashby_url || null,
      signals: finalForm.signals || null,
    };
    setIsProcessing(false);
    onSubmit(data, {
      rawMeetingNotes: meetingNotes.trim() || undefined,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...form,
      email: form.email || null,
      phone: form.phone || null,
      trigger_notes: form.trigger_notes || null,
      warm_path: form.warm_path || null,
      last_touch_date: form.last_touch_date || null,
      last_touch_channel: form.last_touch_channel || null,
      next_touchpoint_date: form.next_touchpoint_date || null,
      notes: form.notes || null,
      ashby_url: form.ashby_url || null,
      signals: form.signals || null,
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {candidate ? "Edit Candidate" : "Add Candidate"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Import sections — shown in Add mode */}
        {isAddMode && (
          <div className="mx-6 mt-4 space-y-4">
            {/* LinkedIn Profile Link */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                LinkedIn Profile Link
              </label>
              <div className="relative">
                <Link
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="url"
                  value={addInputs.linkedinUrl}
                  onChange={(e) => {
                    setAddInputs((p) => ({ ...p, linkedinUrl: e.target.value }));
                    setAddError("");
                  }}
                  placeholder="https://linkedin.com/in/username"
                  className="input-field pl-9 w-full"
                />
              </div>
            </div>

            {/* Add Resume / CV */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Add Resume / CV
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAddInputs((p) => ({ ...p, resumeFile: file }));
                    setResumeFileName(file.name);
                    setAddError("");
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
              >
                {resumeFileName ? (
                  <>
                    <FileText size={14} />
                    {resumeFileName}
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Upload PDF, DOCX, or TXT
                  </>
                )}
              </button>
            </div>

            {/* Meeting Notes */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Paste Meeting Notes
              </label>
              <textarea
                value={addInputs.meetingNotes}
                onChange={(e) => {
                  setAddInputs((p) => ({ ...p, meetingNotes: e.target.value }));
                  setAddError("");
                }}
                placeholder="Paste notes from Granola, Otter, Fireflies, etc. AI will extract all candidate fields automatically..."
                rows={5}
                className="input-field resize-none w-full text-sm"
              />
            </div>

            {addError && (
              <p className="text-sm text-red-400 px-1">{addError}</p>
            )}
          </div>
        )}

        {/* Full edit form — shown in Edit mode only */}
        {!isAddMode && (
          <>
        {form.status === "ready" && (
          <div className="mx-6 mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm font-medium text-green-400">
              🟢 This candidate is ready — loop in Patrick
            </p>
          </div>
        )}
          </>
        )}

        <form onSubmit={isAddMode ? handleAddSubmit : handleEditSubmit} className="p-6 space-y-4">
          {!isAddMode && (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name *">
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Current Company *">
              <input
                required
                value={form.current_company}
                onChange={(e) => setForm({ ...form, current_company: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Current Role *">
              <input
                required
                value={form.current_role}
                onChange={(e) => setForm({ ...form, current_role: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="LinkedIn URL *">
              <input
                required
                value={form.linkedin_url}
                onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Ashby ATS URL">
              <input
                type="url"
                value={form.ashby_url ?? ""}
                onChange={(e) => setForm({ ...form, ashby_url: e.target.value })}
                placeholder="https://app.ashbyhq.com/..."
                className="input-field"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email ?? ""}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Phone">
              <input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Status *">
              <select
                value={form.status}
                onChange={(e) => handleStatusChange(e.target.value as CandidateStatus)}
                className="input-field"
              >
                <option value="cold">🔴 Cold</option>
                <option value="warm">🟡 Warm</option>
                <option value="ready">🟢 Ready</option>
              </select>
            </Field>
            <Field label="Function *">
              <select
                value={form.function}
                onChange={(e) => setForm({ ...form, function: e.target.value as CandidateFunction })}
                className="input-field"
              >
                <option value="engineering">Engineering</option>
                <option value="product">Product</option>
                <option value="gtm">GTM</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Last Touch Date">
              <input
                type="date"
                value={form.last_touch_date ?? ""}
                onChange={(e) => setForm({ ...form, last_touch_date: e.target.value })}
                className="input-field"
              />
            </Field>
            <Field label="Last Touch Channel">
              <select
                value={form.last_touch_channel ?? ""}
                onChange={(e) => setForm({ ...form, last_touch_channel: (e.target.value || null) as TouchChannel | null })}
                className="input-field"
              >
                <option value="">Select...</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Next Touchpoint Date">
              <input
                type="date"
                value={form.next_touchpoint_date ?? ""}
                onChange={(e) => setForm({ ...form, next_touchpoint_date: e.target.value })}
                className="input-field"
              />
            </Field>
          </div>

          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <button
              type="button"
              onClick={() => setShowMeetingNotes(!showMeetingNotes)}
              className="flex w-full items-center justify-between text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText size={14} />
                Paste Meeting Notes (AI extract)
              </span>
              {showMeetingNotes ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>
            {showMeetingNotes && (
              <div className="mt-3 space-y-3">
                <textarea
                  value={meetingNotesText}
                  onChange={(e) => {
                    setMeetingNotesText(e.target.value);
                    setParseError("");
                    setParseSuccess(false);
                  }}
                  placeholder="Paste meeting notes from Granola, Otter, Fireflies, etc. AI will extract warm path, trigger notes, and a summary..."
                  rows={5}
                  className="input-field resize-none w-full text-sm"
                />
                <div className="flex items-center justify-between">
                  <div>
                    {parseError && (
                      <p className="text-xs text-red-400">{parseError}</p>
                    )}
                    {parseSuccess && (
                      <p className="text-xs text-green-400">
                        Extracted fields from notes. Full notes copied to Notes field.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleMeetingNotesParse}
                    disabled={isParsing || !meetingNotesText.trim()}
                    className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isParsing ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      "Extract Fields"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <Field label="Warm Path">
            <input
              value={form.warm_path ?? ""}
              onChange={(e) => setForm({ ...form, warm_path: e.target.value })}
              placeholder="Who at Cognition knows them?"
              className="input-field"
            />
          </Field>

          <Field label="Trigger Notes">
            <textarea
              value={form.trigger_notes ?? ""}
              onChange={(e) => setForm({ ...form, trigger_notes: e.target.value })}
              placeholder="What would make them move?"
              rows={2}
              className="input-field resize-none"
            />
          </Field>

          <Field label="Signals">
            <textarea
              value={form.signals ?? ""}
              onChange={(e) => setForm({ ...form, signals: e.target.value })}
              placeholder="Recent publication, funding news, job change, etc."
              rows={2}
              className="input-field resize-none"
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="General running notes..."
              rows={3}
              className="input-field resize-none"
            />
          </Field>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isProcessing}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {(isSubmitting || isProcessing) ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {isProcessing ? "Processing..." : "Saving..."}
                </>
              ) : candidate ? (
                "Update Candidate"
              ) : (
                "Add Candidate"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}
