"use client";

import { useState, useRef } from "react";
import { X, Link, Loader2, FileText, ChevronDown, ChevronUp, Upload } from "lucide-react";
import { addWeeks } from "@/lib/utils";
import { parseLinkedInProfile, parseMeetingNotes } from "@/lib/actions";
import type { Candidate, CandidateFormData, CandidateStatus, CandidateFunction, TouchChannel } from "@/lib/types";

export default function CandidateForm({
  candidate,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  candidate?: Candidate;
  onSubmit: (data: CandidateFormData) => void;
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

  const [linkedinImportUrl, setLinkedinImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState("");

  const [meetingNotesText, setMeetingNotesText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [showMeetingNotes, setShowMeetingNotes] = useState(true);
  const [parseSuccess, setParseSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  const handleLinkedInImport = async () => {
    if (!linkedinImportUrl.trim()) return;
    setIsImporting(true);
    setImportError("");
    try {
      const result = await parseLinkedInProfile(linkedinImportUrl);
      if (result) {
        setForm((f) => ({
          ...f,
          full_name: result.full_name || f.full_name,
          current_company: result.current_company || f.current_company,
          current_role: result.current_role || f.current_role,
          linkedin_url: result.linkedin_url || f.linkedin_url,
        }));
        setLinkedinImportUrl("");
      } else {
        setImportError(
          "Could not parse profile. The URL may be private or invalid."
        );
      }
    } catch {
      setImportError("Failed to fetch profile. Please try again.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    setIsUploadingResume(true);
    setResumeError("");
    setResumeFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setResumeError(data.error || "Failed to parse resume.");
        return;
      }
      setForm((f) => ({
        ...f,
        full_name: data.full_name || f.full_name,
        current_company: data.current_company || f.current_company,
        current_role: data.current_role || f.current_role,
        email: data.email || f.email,
        phone: data.phone || f.phone,
        linkedin_url: data.linkedin_url || f.linkedin_url,
        notes: data.notes || f.notes,
      }));
      setResumeFileName("");
    } catch {
      setResumeError("Failed to upload resume. Please try again.");
    } finally {
      setIsUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
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
            {/* LinkedIn Import */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Import from LinkedIn
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="url"
                    value={linkedinImportUrl}
                    onChange={(e) => {
                      setLinkedinImportUrl(e.target.value);
                      setImportError("");
                    }}
                    placeholder="https://linkedin.com/in/username"
                    className="input-field pl-9 w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleLinkedInImport();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLinkedInImport}
                  disabled={isImporting || !linkedinImportUrl.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {isImporting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Importing...
                    </>
                  ) : (
                    "Import"
                  )}
                </button>
              </div>
              {importError && (
                <p className="mt-2 text-xs text-red-400">{importError}</p>
              )}
            </div>

            {/* Resume / CV Upload */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Upload a Resume / CV
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingResume}
                className="w-full rounded-lg border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors flex items-center justify-center gap-2"
              >
                {isUploadingResume ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Parsing {resumeFileName}...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Upload PDF, DOCX, or TXT
                  </>
                )}
              </button>
              {resumeError && (
                <p className="mt-2 text-xs text-red-400">{resumeError}</p>
              )}
            </div>

            {/* Meeting Notes */}
            <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-3">
                <FileText size={14} />
                Paste Meeting Notes (AI extract)
              </div>
              <textarea
                value={meetingNotesText}
                onChange={(e) => {
                  setMeetingNotesText(e.target.value);
                  setParseError("");
                  setParseSuccess(false);
                }}
                placeholder="Paste meeting notes from Granola, Otter, Fireflies, etc. AI will extract all candidate fields automatically..."
                rows={5}
                className="input-field resize-none w-full text-sm"
              />
              <div className="flex items-center justify-between mt-3">
                <div>
                  {parseError && (
                    <p className="text-xs text-red-400">{parseError}</p>
                  )}
                  {parseSuccess && (
                    <p className="text-xs text-green-400">
                      Extracted fields from notes.
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

            {/* Preview of parsed data */}
            {(form.full_name || form.current_company || form.current_role) && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800/30 p-4">
                <p className="text-xs font-medium text-zinc-500 mb-2">Parsed Preview</p>
                <div className="space-y-1 text-sm text-zinc-300">
                  {form.full_name && <p><span className="text-zinc-500">Name:</span> {form.full_name}</p>}
                  {form.current_company && <p><span className="text-zinc-500">Company:</span> {form.current_company}</p>}
                  {form.current_role && <p><span className="text-zinc-500">Role:</span> {form.current_role}</p>}
                  {form.email && <p><span className="text-zinc-500">Email:</span> {form.email}</p>}
                  {form.phone && <p><span className="text-zinc-500">Phone:</span> {form.phone}</p>}
                  {form.linkedin_url && <p><span className="text-zinc-500">LinkedIn:</span> {form.linkedin_url}</p>}
                  {form.warm_path && <p><span className="text-zinc-500">Warm Path:</span> {form.warm_path}</p>}
                  {form.trigger_notes && <p><span className="text-zinc-500">Triggers:</span> {form.trigger_notes}</p>}
                </div>
              </div>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting
                ? "Saving..."
                : candidate
                  ? "Update Candidate"
                  : "Add Candidate"}
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
