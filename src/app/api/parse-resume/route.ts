import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Please upload a PDF, DOCX, or TXT file" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
      const result = await parser.getText();
      text = result.text;
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      text = buffer.toString("utf-8");
    } else {
      // For DOCX, extract raw text from the XML content
      const raw = buffer.toString("utf-8");
      // Strip XML tags to get plain text
      text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    }

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. Please try a different format." },
        { status: 400 }
      );
    }

    // Truncate very long resumes to avoid token limits
    const truncated = text.slice(0, 8000);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a resume parser for a technical recruiter at an AI company. Given resume/CV text, extract candidate information and return it as JSON.

Extract these fields:
- "full_name": The candidate's full name
- "current_company": Their most recent/current company
- "current_role": Their most recent/current job title
- "email": Their email address if present
- "phone": Their phone number if present
- "linkedin_url": Their LinkedIn URL if present
- "notes": A brief 2-3 sentence recruiter-friendly summary of their background, key skills, and notable experience

For any field you cannot find, return an empty string.
Return ONLY valid JSON with these seven string fields.`,
        },
        {
          role: "user",
          content: truncated,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to parse resume content" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content) as {
      full_name?: string;
      current_company?: string;
      current_role?: string;
      email?: string;
      phone?: string;
      linkedin_url?: string;
      notes?: string;
    };

    return NextResponse.json({
      full_name: parsed.full_name ?? "",
      current_company: parsed.current_company ?? "",
      current_role: parsed.current_role ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      linkedin_url: parsed.linkedin_url ?? "",
      notes: parsed.notes ?? "",
    });
  } catch (err) {
    console.error("Resume parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse resume. Please try again." },
      { status: 500 }
    );
  }
}
