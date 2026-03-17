export type CandidateStatus = "cold" | "warm" | "ready";
export type CandidateFunction = "engineering" | "product" | "gtm" | "other";
export type TouchChannel = "linkedin" | "email" | "text" | "event" | "other";

export interface Candidate {
  id: string;
  full_name: string;
  current_company: string;
  current_role: string;
  linkedin_url: string;
  email: string | null;
  phone: string | null;
  status: CandidateStatus;
  function: CandidateFunction;
  trigger_notes: string | null;
  warm_path: string | null;
  last_touch_date: string | null;
  last_touch_channel: TouchChannel | null;
  next_touchpoint_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface Touchpoint {
  id: string;
  candidate_id: string;
  date: string;
  channel: TouchChannel;
  notes: string | null;
  created_at: string;
}

export type CandidateFormData = Omit<Candidate, "id" | "created_at">;
