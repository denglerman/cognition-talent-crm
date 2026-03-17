import { CandidateStatus, TouchChannel, CandidateFunction } from "./types";

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  const date = new Date(dateOnly + "T00:00:00");
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  const date = new Date(dateOnly + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const dateOnly = dateStr.split("T")[0].split(" ")[0];
  return dateOnly === new Date().toISOString().split("T")[0];
}

export function addWeeks(weeks: number): string {
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  return date.toISOString().split("T")[0];
}

export function getStatusColor(status: CandidateStatus): string {
  switch (status) {
    case "cold":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "warm":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "ready":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
  }
}

export function getStatusEmoji(status: CandidateStatus): string {
  switch (status) {
    case "cold":
      return "🔴";
    case "warm":
      return "🟡";
    case "ready":
      return "🟢";
    default:
      return "⚪";
  }
}

export function getChannelLabel(channel: TouchChannel | string | null): string {
  switch (channel) {
    case "linkedin":
      return "LinkedIn";
    case "email":
      return "Email";
    case "text":
      return "Text";
    case "event":
      return "Event";
    case "other":
      return "Other";
    default:
      return "—";
  }
}

export function getFunctionLabel(fn: CandidateFunction | string): string {
  switch (fn) {
    case "engineering":
      return "Engineering";
    case "product":
      return "Product";
    case "gtm":
      return "GTM";
    case "other":
      return "Other";
    default:
      return fn;
  }
}
