export type CandidateStatus = "cold" | "warm" | "hot";
export type CandidateFunction = "engineering" | "product" | "gtm" | "other";
export type TouchChannel = "linkedin" | "email" | "text" | "event" | "other";

export interface Candidate {
  id: string;
  full_name: string | null;
  current_company: string | null;
  current_role: string | null;
  linkedin_url: string | null;
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
  ashby_url: string | null;
  signals: string | null;
  status_updated_at: string;
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

export interface EmailDraft {
  id: string;
  candidate_id: string;
  subject: string | null;
  body: string;
  created_at: string;
}

export type CandidateFormData = Omit<Candidate, "id" | "created_at">;
