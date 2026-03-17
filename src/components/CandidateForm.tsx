"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addWeeks } from "@/lib/utils";
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
  });

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

        {form.status === "ready" && (
          <div className="mx-6 mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            <p className="text-sm font-medium text-green-400">
              🟢 This candidate is ready — loop in Patrick
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          <Field label="Notes">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="General running notes..."
              rows={3}
              className="input-field resize-none"
            />
          </Field>

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
