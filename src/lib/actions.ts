"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { CandidateFormData } from "./types";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getCandidates() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getCandidate(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createCandidate(formData: CandidateFormData) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("candidates")
    .insert(formData)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  return data;
}

export async function updateCandidate(
  id: string,
  updates: Partial<CandidateFormData>
) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("candidates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath(`/candidates/${id}`);
  return data;
}

export async function deleteCandidate(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function getTouchpoints(candidateId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("touchpoints")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createTouchpoint(touchpoint: {
  candidate_id: string;
  date: string;
  channel: string;
  notes?: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("touchpoints")
    .insert(touchpoint)
    .select()
    .single();
  if (error) throw new Error(error.message);

  // Update candidate's last touch info
  await supabase
    .from("candidates")
    .update({
      last_touch_date: touchpoint.date,
      last_touch_channel: touchpoint.channel,
    })
    .eq("id", touchpoint.candidate_id);

  revalidatePath(`/candidates/${touchpoint.candidate_id}`);
  revalidatePath("/");
  return data;
}
