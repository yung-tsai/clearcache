-- Clear Cache Journaling App - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable extensions
create extension if not exists pgcrypto;

-- Profiles table
create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

-- Journal entries table
create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content text,
  transcript text,
  audio_path text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Feature flags (global)
create table if not exists feature_flags (
  key text primary key,
  enabled boolean not null default true,
  notes text
);

-- Per-user overrides
create table if not exists user_feature_overrides (
  user_id uuid references auth.users(id) on delete cascade,
  key text references feature_flags(key) on delete cascade,
  enabled boolean not null,
  primary key (user_id, key)
);

-- Seed default feature flags
insert into feature_flags(key, enabled, notes) values
  ('voice_to_text', true, 'Browser Web Speech API'),
  ('sounds', true, 'UI sound effects'),
  ('ai_reflection', false, 'Iteration 2 feature')
  on conflict (key) do nothing;

-- Enable Row Level Security
alter table profiles enable row level security;
alter table entries enable row level security;
alter table feature_flags enable row level security;
alter table user_feature_overrides enable row level security;

-- RLS Policies for profiles
create policy "profile_self_read" on profiles
  for select using (auth.uid() = user_id or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin');
create policy "profile_self_write" on profiles
  for update using (auth.uid() = user_id);
create policy "profile_create" on profiles
  for insert with check (auth.uid() = user_id);

-- RLS Policies for entries (owner-only CRUD)
create policy "entries_owner_read" on entries for select using (auth.uid() = user_id);
create policy "entries_owner_write" on entries for all using (auth.uid() = user_id);

-- RLS Policies for feature flags (everyone read, admin write)
create policy "flags_read_all" on feature_flags for select using (true);
create policy "flags_admin_write" on feature_flags for all
  using ((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin');

-- RLS Policies for user overrides
create policy "overrides_read" on user_feature_overrides for select using (
  auth.uid() = user_id or (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
);
create policy "overrides_write_self" on user_feature_overrides for all using (auth.uid() = user_id);
create policy "overrides_write_admin" on user_feature_overrides for all using (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
);

-- Function to handle user creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for entries updated_at
create trigger entries_updated_at
  before update on entries
  for each row execute procedure update_updated_at();