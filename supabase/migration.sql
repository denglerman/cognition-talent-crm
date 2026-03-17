-- Cognition Talent CRM - Database Migration
-- Run this in Supabase SQL Editor or via psql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  current_company TEXT NOT NULL,
  "current_role" TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'cold' CHECK (status IN ('cold', 'warm', 'ready')),
  "function" TEXT NOT NULL DEFAULT 'engineering' CHECK ("function" IN ('engineering', 'product', 'gtm', 'other')),
  trigger_notes TEXT,
  warm_path TEXT,
  last_touch_date DATE,
  last_touch_channel TEXT CHECK (last_touch_channel IS NULL OR last_touch_channel IN ('linkedin', 'email', 'text', 'event', 'other')),
  next_touchpoint_date DATE,
  notes TEXT,
  ashby_url TEXT,
  signals TEXT,
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create touchpoints table
CREATE TABLE IF NOT EXISTS touchpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'email', 'text', 'event', 'other')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_drafts table
CREATE TABLE IF NOT EXISTS email_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on touchpoints for candidate lookup
CREATE INDEX IF NOT EXISTS idx_touchpoints_candidate_id ON touchpoints(candidate_id);

-- Create index on email_drafts for candidate lookup
CREATE INDEX IF NOT EXISTS idx_email_drafts_candidate_id ON email_drafts(candidate_id);

-- Enable Row Level Security (allow all for now with service role)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_drafts ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations (since this is an internal tool)
CREATE POLICY "Allow all on candidates" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on touchpoints" ON touchpoints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on email_drafts" ON email_drafts FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO candidates (full_name, current_company, "current_role", linkedin_url, email, phone, status, "function", trigger_notes, warm_path, last_touch_date, last_touch_channel, next_touchpoint_date, notes)
VALUES
  ('Priya Sharma', 'Google DeepMind', 'Senior Research Engineer', 'https://linkedin.com/in/priya-sharma-ai', 'priya.sharma@gmail.com', NULL, 'warm', 'engineering', 'Frustrated with bureaucracy at DeepMind. Interested in smaller teams with more ownership. Would move for a founding-level role.', 'Patrick met her at NeurIPS 2025. They had coffee and discussed AGI safety.', '2026-02-26', 'linkedin', '2026-04-09', 'Strong systems ML background. Built the training infra for Gemini 2. Very sharp, would be a top hire.'),
  ('Marcus Chen', 'Anthropic', 'Staff Software Engineer', 'https://linkedin.com/in/marcuschen', 'marcus.chen@proton.me', '+1 415-555-0142', 'cold', 'engineering', 'Happy at Anthropic but interested in the dev tools space. Would consider if comp is competitive.', NULL, '2026-01-13', 'event', '2026-03-14', 'Met at AI Engineer Summit. Deep expertise in LLM inference optimization. 10+ years experience.'),
  ('Aaliya Johnson', 'Stripe', 'Product Lead, Developer Platform', 'https://linkedin.com/in/aaliya-johnson', 'aaliya.j@hey.com', NULL, 'ready', 'product', 'Stripe is doing layoffs in her org. She reached out proactively asking about PM roles.', 'Alex went to Stanford with her. Strong referral.', '2026-03-13', 'email', '2026-03-19', 'Incredible product sense. Led the Stripe CLI and developer dashboard redesign. Very interested in AI tooling.'),
  ('James Okafor', 'Notion', 'Engineering Manager', 'https://linkedin.com/in/jamesokafor', NULL, '+1 628-555-0198', 'warm', 'engineering', 'Wants to go back to IC work. Interested in hard technical problems, not people management.', 'Worked with Sarah at Meta before. She can make a warm intro.', '2026-02-14', 'linkedin', '2026-03-15', 'Former Meta E7. Led the Notion AI integration team. Would be excellent as a tech lead.'),
  ('Elena Rodriguez', 'Linear', 'Senior Product Manager', 'https://linkedin.com/in/elena-rodriguez-pm', 'elena.r@linear.app', NULL, 'cold', 'product', 'Very loyal to Linear but has expressed interest in AI-first companies. Long-term prospect.', NULL, '2025-12-16', 'linkedin', '2026-03-30', 'Exceptional taste in product design. Built Linear''s project management features. Worth nurturing long-term.')
ON CONFLICT DO NOTHING;

-- Seed touchpoints
INSERT INTO touchpoints (candidate_id, date, channel, notes)
SELECT c.id, '2026-02-26'::date, 'linkedin', 'Sent a LinkedIn message about Cognition''s latest launch. She replied with interest and asked about team size.'
FROM candidates c WHERE c.full_name = 'Priya Sharma'
UNION ALL
SELECT c.id, '2026-01-15'::date, 'email', 'Followed up after NeurIPS with a personalized note about our inference challenges.'
FROM candidates c WHERE c.full_name = 'Priya Sharma'
UNION ALL
SELECT c.id, '2026-01-13'::date, 'event', 'Brief chat at AI Engineer Summit. Exchanged contact info.'
FROM candidates c WHERE c.full_name = 'Marcus Chen'
UNION ALL
SELECT c.id, '2026-03-13'::date, 'email', 'She emailed asking about PM openings. Sent back the JD and scheduled a call for next week.'
FROM candidates c WHERE c.full_name = 'Aaliya Johnson'
UNION ALL
SELECT c.id, '2026-03-02'::date, 'email', 'She followed up asking about team size and culture. Sent a detailed response.'
FROM candidates c WHERE c.full_name = 'Aaliya Johnson'
UNION ALL
SELECT c.id, '2026-02-14'::date, 'linkedin', 'Casual check-in on LinkedIn. He mentioned he''s feeling burnt out on management.'
FROM candidates c WHERE c.full_name = 'James Okafor'
UNION ALL
SELECT c.id, '2025-12-16'::date, 'linkedin', 'Connected on LinkedIn after her talk at ProductCon. Brief intro message.'
FROM candidates c WHERE c.full_name = 'Elena Rodriguez';
