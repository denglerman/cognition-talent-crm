"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import OpenAI from "openai";
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

export async function parseLinkedInProfile(url: string): Promise<{
  full_name: string;
  current_company: string;
  current_role: string;
  linkedin_url: string;
} | null> {
  try {
    // Normalize the LinkedIn URL
    const cleanUrl = url.trim().split("?")[0].replace(/\/$/, "");
    if (!cleanUrl.includes("linkedin.com/in/")) {
      return null;
    }

    const res = await fetch(cleanUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Try og:title first: usually "Name - Role - Company | LinkedIn"
    const ogTitleMatch = html.match(
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i
    ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i
      );

    // Try <title> tag as fallback
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const raw = ogTitleMatch?.[1] ?? titleMatch?.[1] ?? "";
    // Remove "| LinkedIn" suffix
    const cleaned = raw.replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();

    if (!cleaned) return null;

    // Parse "Name - Role - Company" or "Name - Role at Company"
    const parts = cleaned.split(" - ").map((s) => s.trim());

    let full_name = "";
    let current_role = "";
    let current_company = "";

    if (parts.length >= 3) {
      full_name = parts[0];
      current_role = parts[1];
      current_company = parts.slice(2).join(" - ");
    } else if (parts.length === 2) {
      full_name = parts[0];
      // Second part might be "Role at Company"
      const atSplit = parts[1].split(/ at /i);
      if (atSplit.length >= 2) {
        current_role = atSplit[0].trim();
        current_company = atSplit.slice(1).join(" at ").trim();
      } else {
        current_role = parts[1];
      }
    } else {
      full_name = parts[0];
    }

    // Also try to get description for more context
    const ogDescMatch = html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i
    ) ??
      html.match(
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i
      );

    // Description often has better company/role info
    if (ogDescMatch?.[1] && (!current_company || !current_role)) {
      const desc = ogDescMatch[1];
      // Common patterns: "Role at Company" or "Company · Role"
      const atMatch = desc.match(/^([^·]+)\s+at\s+([^·.]+)/i);
      const dotMatch = desc.match(/^([^·]+)·\s*([^·]+)/);
      if (atMatch && !current_role) {
        current_role = current_role || atMatch[1].trim();
        current_company = current_company || atMatch[2].trim();
      } else if (dotMatch && !current_company) {
        current_company = current_company || dotMatch[1].trim();
      }
    }

    return {
      full_name,
      current_company,
      current_role,
      linkedin_url: cleanUrl,
    };
  } catch {
    return null;
  }
}

export async function parseMeetingNotes(
  notes: string,
  candidateName?: string
): Promise<{
  full_name: string;
  current_company: string;
  current_role: string;
  email: string;
  phone: string;
  linkedin_url: string;
  warm_path: string;
  trigger_notes: string;
  status: string;
  last_touch_date: string;
  last_touch_channel: string;
} | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const nameContext = candidateName
      ? `The candidate's name is ${candidateName}.`
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an assistant for a technical recruiter at an AI company called Cognition. You extract structured information from meeting notes or AI notetaker transcripts.

Given meeting notes, extract AS MANY of the following fields as possible and return them as JSON:

1. "full_name" - The candidate's full name.
2. "current_company" - Their current company.
3. "current_role" - Their current job title/role.
4. "email" - Their email address if mentioned.
5. "phone" - Their phone number if mentioned.
6. "linkedin_url" - Their LinkedIn URL if mentioned.
7. "warm_path" - Who at Cognition (or the recruiter's network) has a connection to this candidate? Mutual contacts, referrals, who introduced them, shared history, etc.
8. "trigger_notes" - What would make this candidate move/switch jobs? Frustrations, desires, career goals, what they're looking for, deal-breakers, compensation expectations, timeline, etc.
9. "status" - The candidate's interest level. Use "cold" if not interested or very early, "warm" if somewhat interested or open to conversations, "ready" if actively looking or ready to move. Only set if clearly indicated.
10. "last_touch_date" - The date of this meeting/interaction in YYYY-MM-DD format. Look for dates mentioned in the notes.
11. "last_touch_channel" - The channel of this interaction. Must be one of: "linkedin", "email", "text", "event", "other". Infer from context (e.g. video call = "other", LinkedIn message = "linkedin", etc.).

${nameContext}

For any field you cannot determine from the notes, return an empty string.
Return ONLY valid JSON with all eleven string fields listed above.`,
        },
        {
          role: "user",
          content: notes,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as Record<string, string | undefined>;

    return {
      full_name: parsed.full_name ?? "",
      current_company: parsed.current_company ?? "",
      current_role: parsed.current_role ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      linkedin_url: parsed.linkedin_url ?? "",
      warm_path: parsed.warm_path ?? "",
      trigger_notes: parsed.trigger_notes ?? "",
      status: parsed.status ?? "",
      last_touch_date: parsed.last_touch_date ?? "",
      last_touch_channel: parsed.last_touch_channel ?? "",
    };
  } catch {
    return null;
  }
}

export async function generateOutreachEmail(context: {
  full_name: string;
  current_company: string;
  current_role: string;
  status: string;
  trigger_notes: string | null;
  warm_path: string | null;
  notes: string | null;
  last_touch_date: string | null;
  last_touch_channel: string | null;
  touchpoints: { date: string; channel: string; notes: string | null }[];
}): Promise<string | null> {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const touchpointHistory = context.touchpoints.length > 0
      ? context.touchpoints
          .map(
            (tp) =>
              `- ${tp.date} (${tp.channel}): ${tp.notes || "No notes"}`
          )
          .join("\n")
      : "No previous touchpoints logged.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: `You are a recruiter at Cognition, an AI company building Devin (the AI software engineer). You write short, personal outreach emails to engineering and product candidates.

Your style:
- SHORT lines, like text messages. Each line is 1-2 sentences max.
- Line breaks between each thought. NOT long paragraphs.
- Warm, genuine, not salesy or corporate.
- Reference specific details from their profile and past conversations.
- If there's a warm path (mutual connection), use it naturally.
- If there are trigger notes (what would make them move), subtly weave that in.
- If you've spoken before, reference when and what you discussed.
- Keep the whole email under 100 words.
- No subject line needed — just the email body.
- Sign off with just "Alex" (the recruiter's name).
- Do NOT use brackets or placeholders. Write the actual email.`,
        },
        {
          role: "user",
          content: `Generate an outreach email for this candidate:

Name: ${context.full_name}
Role: ${context.current_role} at ${context.current_company}
Status: ${context.status}
${context.warm_path ? `Warm Path: ${context.warm_path}` : ""}
${context.trigger_notes ? `Trigger Notes: ${context.trigger_notes}` : ""}
${context.notes ? `Notes: ${context.notes}` : ""}
${context.last_touch_date ? `Last Contact: ${context.last_touch_date} via ${context.last_touch_channel}` : "Never contacted before."}

Touchpoint History:
${touchpointHistory}`,
        },
      ],
    });

    return response.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function batchUpdateCandidates(
  ids: string[],
  updates: Partial<CandidateFormData>
) {
  if (ids.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase
    .from("candidates")
    .update(updates)
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/");
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
