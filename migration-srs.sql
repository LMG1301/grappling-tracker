-- Migration: SRS Review Module
-- Date: 2026-04-06

-- 1. Cards
create table srs_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  position_name text not null,
  category text not null check (category in (
    'guard_retention', 'escapes', 'half_guard_bottom',
    'mount_top', 'side_control_top', 'back_control',
    'standing', 'submissions', 'turtle'
  )),
  situation text not null,
  image_url text,
  answer text not null,
  cues text,
  grappling_link text,
  video_url text,
  video_timestamp_sec int default 0,
  ease_factor float default 2.5,
  interval_days int default 0,
  repetitions int default 0,
  next_review date default current_date,
  last_review date,
  times_reviewed int default 0,
  times_correct int default 0,
  mat_tested int default 0,
  mat_success int default 0,
  is_active boolean default true,
  source text check (source in ('starter', 'submeta', 'coach', 'custom')),
  created_at timestamptz default now()
);

-- 2. Sessions
create table srs_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  session_date date default current_date,
  cards_reviewed int default 0,
  cards_correct int default 0,
  cards_again int default 0,
  xp_earned int default 0,
  duration_sec int,
  created_at timestamptz default now()
);

-- 3. Mat feedback
create table srs_mat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  card_id uuid references srs_cards(id) on delete cascade,
  training_date date default current_date,
  attempted boolean default false,
  succeeded boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 4. Stats
create table srs_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  current_streak int default 0,
  longest_streak int default 0,
  total_xp int default 0,
  level int default 1,
  total_reviews int default 0,
  total_mat_tests int default 0,
  last_review_date date,
  updated_at timestamptz default now()
);

-- RLS
alter table srs_cards enable row level security;
alter table srs_sessions enable row level security;
alter table srs_mat_feedback enable row level security;
alter table srs_stats enable row level security;

create policy "Users CRUD own cards" on srs_cards for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users CRUD own srs sessions" on srs_sessions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users CRUD own mat feedback" on srs_mat_feedback for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users CRUD own srs stats" on srs_stats for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
