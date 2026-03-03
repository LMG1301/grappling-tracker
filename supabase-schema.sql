-- Run this in your Supabase SQL Editor to set up the database

-- Positions table (user-customizable)
create table public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.positions enable row level security;

create policy "Users can view their own positions"
  on public.positions for select using (auth.uid() = user_id);
create policy "Users can insert their own positions"
  on public.positions for insert with check (auth.uid() = user_id);
create policy "Users can update their own positions"
  on public.positions for update using (auth.uid() = user_id);
create policy "Users can delete their own positions"
  on public.positions for delete using (auth.uid() = user_id);

-- Techniques table
create table public.techniques (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  position text not null,
  action_type text not null check (action_type in ('submission', 'sweep', 'pass', 'escape', 'transition', 'takedown')),
  video_url text,
  image_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.techniques enable row level security;

create policy "Users can view their own techniques"
  on public.techniques for select using (auth.uid() = user_id);
create policy "Users can insert their own techniques"
  on public.techniques for insert with check (auth.uid() = user_id);
create policy "Users can update their own techniques"
  on public.techniques for update using (auth.uid() = user_id);
create policy "Users can delete their own techniques"
  on public.techniques for delete using (auth.uid() = user_id);

-- Create a function to update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.techniques
  for each row execute function public.handle_updated_at();

-- Storage bucket for technique images
insert into storage.buckets (id, name, public) values ('technique-images', 'technique-images', true);

create policy "Users can upload their own images"
  on storage.objects for insert
  with check (bucket_id = 'technique-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own images"
  on storage.objects for select
  using (bucket_id = 'technique-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own images"
  on storage.objects for delete
  using (bucket_id = 'technique-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Public can view technique images"
  on storage.objects for select
  using (bucket_id = 'technique-images');
