"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { getChannelLabel, formatDate } from "@/lib/utils";
import type { Touchpoint } from "@/lib/types";

export default function TouchpointLog({
  touchpoints,
  onAdd,
}: {
  touchpoints: Touchpoint[];
  onAdd: (data: { date: string; channel: string; notes: string }) => Promise<void>;
}) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [channel, setChannel] = useState("linkedin");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onAdd({ date, channel, notes });
      setNotes("");
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">
          Touchpoint Log
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Plus size={14} /> Log Touchpoint
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">
                Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="input-field"
              >
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="text">Text</option>
                <option value="event">Event</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What happened?"
              className="input-field resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      {touchpoints.length === 0 ? (
        <p className="text-sm text-zinc-500 py-4">No touchpoints yet.</p>
      ) : (
        <div className="space-y-3">
          {touchpoints.map((tp) => (
            <div
              key={tp.id}
              className="flex items-start gap-3 rounded-lg bg-zinc-800/30 px-4 py-3"
            >
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-zinc-300">
                    {formatDate(tp.date)}
                  </span>
                  <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-400">
                    {getChannelLabel(tp.channel)}
                  </span>
                </div>
                {tp.notes && (
                  <p className="mt-1 text-sm text-zinc-400">{tp.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
