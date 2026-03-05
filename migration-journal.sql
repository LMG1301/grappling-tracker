-- Run this in Supabase SQL Editor

-- 1. Add date field to techniques
alter table public.techniques add column learned_date date;

-- 2. Create journal entries table
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  entry_date date not null default current_date,
  title text,
  content text not null,
  mood text check (mood in ('great', 'good', 'ok', 'tough', 'bad')),
  techniques_worked text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.journal_entries enable row level security;

create policy "Users can view their own journal entries"
  on public.journal_entries for select using (auth.uid() = user_id);
create policy "Users can insert their own journal entries"
  on public.journal_entries for insert with check (auth.uid() = user_id);
create policy "Users can update their own journal entries"
  on public.journal_entries for update using (auth.uid() = user_id);
create policy "Users can delete their own journal entries"
  on public.journal_entries for delete using (auth.uid() = user_id);

create trigger set_journal_updated_at
  before update on public.journal_entries
  for each row execute function public.handle_updated_at();
