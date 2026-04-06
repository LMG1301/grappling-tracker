-- Migration: Integrate SRS into techniques table
-- Date: 2026-04-06
-- Replaces maturity system with SRS spaced repetition

-- 1. Add flashcard fields
alter table techniques add column if not exists situation text;
alter table techniques add column if not exists answer text;
alter table techniques add column if not exists cues text;

-- 2. Add SRS state fields
alter table techniques add column if not exists ease_factor float default 2.5;
alter table techniques add column if not exists interval_days int default 0;
alter table techniques add column if not exists srs_repetitions int default 0;
alter table techniques add column if not exists next_review date;
alter table techniques add column if not exists last_review date;
alter table techniques add column if not exists times_reviewed int default 0;
alter table techniques add column if not exists times_correct int default 0;
alter table techniques add column if not exists mat_tested int default 0;
alter table techniques add column if not exists mat_success int default 0;
alter table techniques add column if not exists srs_active boolean default false;

-- 3. Drop maturity column
alter table techniques drop column if exists maturity;

-- 4. Drop maturity check constraint if exists
-- (the constraint name may vary, this handles common patterns)
do $$
begin
  alter table techniques drop constraint if exists techniques_maturity_check;
exception when others then null;
end $$;

-- 5. Update srs_mat_feedback to reference techniques instead of srs_cards
-- (if srs_mat_feedback already exists with card_id, we recreate it)
drop table if exists srs_mat_feedback;
create table srs_mat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  technique_id uuid references techniques(id) on delete cascade,
  training_date date default current_date,
  attempted boolean default false,
  succeeded boolean default false,
  created_at timestamptz default now()
);

alter table srs_mat_feedback enable row level security;
create policy "Users CRUD own mat feedback v2" on srs_mat_feedback for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 6. Ensure srs_sessions exists (may already exist from previous migration)
create table if not exists srs_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_date date default current_date,
  cards_reviewed int default 0,
  cards_correct int default 0,
  xp_earned int default 0,
  duration_sec int,
  created_at timestamptz default now()
);

-- 7. Ensure srs_stats exists
create table if not exists srs_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  current_streak int default 0,
  longest_streak int default 0,
  total_xp int default 0,
  level int default 1,
  last_review_date date,
  updated_at timestamptz default now()
);
