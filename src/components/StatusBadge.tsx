import { CandidateStatus } from "@/lib/types";
import { getStatusColor, getStatusEmoji } from "@/lib/utils";

export default function StatusBadge({
  status,
  size = "md",
}: {
  status: CandidateStatus;
  size?: "sm" | "md";
}) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${getStatusColor(status)} ${sizeClasses}`}
    >
      {getStatusEmoji(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
