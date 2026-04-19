-- FelloWorks MVP — Database Schema
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- Tables are created in dependency order.

-- -----------------------------------------------------------------------
-- Enable UUID generation (Supabase has this by default, but just in case)
-- -----------------------------------------------------------------------
create extension if not exists "pgcrypto";


-- -----------------------------------------------------------------------
-- members
-- Core profile table. id matches the Supabase auth.users id.
-- -----------------------------------------------------------------------
create table public.members (
  id                    uuid primary key references auth.users(id) on delete cascade,
  created_at            timestamptz not null default now(),

  first_name            text not null,
  last_name             text not null,
  email                 text not null unique,
  username              text not null unique,  -- slug used in profile URL: /members/[username]

  role                  text,                  -- e.g. "Brand designer & art director"
  bio                   text,
  location              text,                  -- free text, e.g. "Amsterdam, NL"

  languages             text[]  default '{}',  -- e.g. '{English, French}'
  skills                text[]  default '{}',  -- e.g. '{Brand design, Art direction}'

  rate_min              integer,               -- EUR per day
  rate_max              integer,
  rate_notes            text,

  website_url           text,
  linkedin_url          text,
  other_links           text[]  default '{}',

  -- Availability — members set a specific date; browse brackets are calculated from it
  availability_status   text not null default 'unavailable'
                          check (availability_status in ('now', 'from_date', 'unavailable')),
  availability_date     date,                  -- nullable; used when status = 'from_date'
  availability_updated_at timestamptz,         -- shown on profile as trust signal

  invited_by            uuid references public.members(id) on delete set null,
  member_since          date not null default current_date
);

-- Allow members to read all other members (network is authenticated-only)
alter table public.members enable row level security;

create policy "Members can read all members"
  on public.members for select
  using (auth.role() = 'authenticated');

create policy "Members can update their own record"
  on public.members for update
  using (auth.uid() = id);


-- -----------------------------------------------------------------------
-- portfolio_items
-- Work samples attached to a member profile. No cap on storage.
-- Profile view shows 3 most recent by default (handled in queries, not here).
-- -----------------------------------------------------------------------
create table public.portfolio_items (
  id            uuid primary key default gen_random_uuid(),
  member_id     uuid not null references public.members(id) on delete cascade,
  created_at    timestamptz not null default now(),

  title         text not null,
  description   text,
  type          text,                           -- e.g. "Case study", "Campaign", "Editorial"
  year          integer,
  project_url   text,                           -- the source URL pasted by the member
  image_url     text,                           -- OG image or manually uploaded
  og_fetched    boolean not null default false  -- true once OG metadata has been auto-populated
);

alter table public.portfolio_items enable row level security;

create policy "Members can read all portfolio items"
  on public.portfolio_items for select
  using (auth.role() = 'authenticated');

create policy "Members can manage their own portfolio items"
  on public.portfolio_items for all
  using (auth.uid() = member_id);


-- -----------------------------------------------------------------------
-- invites
-- One row per invite. Token is embedded in the invite URL.
-- -----------------------------------------------------------------------
create table public.invites (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  inviter_id      uuid not null references public.members(id) on delete cascade,
  invitee_email   text not null,
  token           text not null unique,
  expires_at      timestamptz not null,
  used_at         timestamptz             -- null = invite is still valid
);

-- Invites are read/written server-side only (service role key).
-- No RLS policies needed beyond blocking direct client access.
alter table public.invites enable row level security;

-- Only the backend (service role) can access invites directly.
-- No authenticated-user policies — all invite operations go through the API.


-- -----------------------------------------------------------------------
-- needs
-- A posted "need" from a lead freelancer looking for a collaborator.
-- -----------------------------------------------------------------------
create table public.needs (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  member_id           uuid not null references public.members(id) on delete cascade,

  skill_title         text not null,
  skill_tags          text[]  default '{}',

  description         text not null,
  collaboration_type  text,

  -- Timeline fields are label strings chosen from dropdowns in the UI
  start_date_label    text,   -- e.g. "Immediately", "Within 2 weeks"
  duration_label      text,   -- e.g. "1–4 weeks", "Ongoing"
  commitment_label    text,   -- e.g. "Part-time", "Full-time"

  rate_min            integer,
  rate_max            integer,
  rate_notes          text,

  visibility          text not null default 'all'
                        check (visibility in ('all', 'network', 'invite')),
  status              text not null default 'active'
                        check (status in ('active', 'draft', 'closed'))
);

alter table public.needs enable row level security;

create policy "Members can read active needs"
  on public.needs for select
  using (auth.role() = 'authenticated' and status = 'active');

create policy "Members can manage their own needs"
  on public.needs for all
  using (auth.uid() = member_id);


-- -----------------------------------------------------------------------
-- messages
-- Direct messages between two members.
-- -----------------------------------------------------------------------
create table public.messages (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  sender_id     uuid not null references public.members(id) on delete cascade,
  recipient_id  uuid not null references public.members(id) on delete cascade,

  body          text not null,
  read_at       timestamptz   -- null = unread
);

alter table public.messages enable row level security;

-- Members can only read messages they sent or received
create policy "Members can read their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Members can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

create policy "Recipients can mark messages as read"
  on public.messages for update
  using (auth.uid() = recipient_id);


-- -----------------------------------------------------------------------
-- shortlist_items
-- Members save other members to their shortlist (heart toggle on cards).
-- -----------------------------------------------------------------------
create table public.shortlist_items (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  member_id       uuid not null references public.members(id) on delete cascade,
  saved_member_id uuid not null references public.members(id) on delete cascade,

  unique (member_id, saved_member_id)   -- prevents duplicate saves
);

alter table public.shortlist_items enable row level security;

create policy "Members can manage their own shortlist"
  on public.shortlist_items for all
  using (auth.uid() = member_id);


-- -----------------------------------------------------------------------
-- feedback
-- Post-engagement text feedback. No star ratings — ever.
-- Four structured text questions, both sides complete independently.
-- -----------------------------------------------------------------------
create table public.feedback (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),

  reviewer_id             uuid not null references public.members(id) on delete cascade,
  reviewed_id             uuid not null references public.members(id) on delete cascade,

  collaboration_context   text,           -- optional: brief description of the project

  -- The four feedback questions (text responses only — no scores)
  q1_deliver              text not null,  -- "Did they deliver on what was agreed?"
  q2_communicate          text not null,  -- "Did they communicate proactively?"
  q3_client_facing        text not null,  -- "Would you bring them into a client-facing project?"
  q4_strongest            text not null,  -- "What was their strongest contribution?"

  visible_on_profile      boolean not null default true
);

alter table public.feedback enable row level security;

-- Feedback is visible to all authenticated members on the reviewed member's profile
create policy "Members can read visible feedback"
  on public.feedback for select
  using (auth.role() = 'authenticated' and visible_on_profile = true);

create policy "Members can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = reviewer_id);
