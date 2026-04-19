-- Migration: Redesign feedback table
-- Run in Supabase SQL editor before deploying backend changes.
-- This drops and recreates the feedback table with the new schema.
-- Existing seed feedback will be lost — re-run seed-members.js afterwards.

drop table if exists public.feedback;

create table public.feedback (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),

  reviewer_id             uuid not null references public.members(id) on delete cascade,
  reviewed_id             uuid not null references public.members(id) on delete cascade,

  body                    text not null,
  would_collaborate_again boolean not null default true,

  status                  text not null default 'pending'
                            check (status in ('pending', 'approved', 'declined')),

  unique (reviewer_id, reviewed_id)  -- one piece of feedback per direction per pair
);

alter table public.feedback enable row level security;

-- Approved feedback is visible to all authenticated members
create policy "Members can read approved feedback"
  on public.feedback for select
  using (auth.role() = 'authenticated' and status = 'approved');

-- Recipients can also read their own pending/declined feedback (to approve/decline it)
create policy "Recipients can read their own feedback"
  on public.feedback for select
  using (auth.uid() = reviewed_id);

-- Members can submit feedback
create policy "Members can submit feedback"
  on public.feedback for insert
  with check (auth.uid() = reviewer_id);

-- Recipients can update status (approve or decline)
create policy "Recipients can respond to feedback"
  on public.feedback for update
  using (auth.uid() = reviewed_id);
