-- =============================================================================
-- Groove — Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------------

-- Users (mirrors auth.users)
create table if not exists public.users (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique not null,
  display_name  text,
  bio           text,
  avatar_url    text,
  is_pro        boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Habits
create table if not exists public.habits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users (id) on delete cascade,
  name          text not null,
  icon          text not null,
  color         text not null,
  frequency     text not null check (frequency in ('daily', 'custom')),
  custom_days   int[],   -- [0..6] where 0 = Sunday; null when frequency = 'daily'
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Check-ins
create table if not exists public.check_ins (
  id            uuid primary key default gen_random_uuid(),
  habit_id      uuid not null references public.habits (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  checked_date  date not null,
  proof_url     text,
  note          text,
  created_at    timestamptz not null default now(),
  unique (habit_id, checked_date)
);

-- Follows
create table if not exists public.follows (
  follower_id   uuid not null references public.users (id) on delete cascade,
  following_id  uuid not null references public.users (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- Communities
create table if not exists public.communities (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text,
  topic_tag     text,
  creator_id    uuid references public.users (id) on delete set null,
  member_count  int not null default 0,
  created_at    timestamptz not null default now()
);

-- Community members
create table if not exists public.community_members (
  community_id  uuid not null references public.communities (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  joined_at     timestamptz not null default now(),
  primary key (community_id, user_id)
);

-- Reactions
create table if not exists public.reactions (
  id            uuid primary key default gen_random_uuid(),
  check_in_id   uuid not null references public.check_ins (id) on delete cascade,
  user_id       uuid not null references public.users (id) on delete cascade,
  type          text not null check (type in ('fire', 'muscle', 'star')),
  created_at    timestamptz not null default now(),
  unique (check_in_id, user_id, type)
);

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

create index if not exists habits_user_id_idx         on public.habits (user_id);
create index if not exists check_ins_habit_id_idx     on public.check_ins (habit_id);
create index if not exists check_ins_user_id_idx      on public.check_ins (user_id);
create index if not exists check_ins_checked_date_idx on public.check_ins (checked_date);
create index if not exists follows_follower_id_idx    on public.follows (follower_id);
create index if not exists follows_following_id_idx   on public.follows (following_id);
create index if not exists reactions_check_in_id_idx  on public.reactions (check_in_id);

-- ---------------------------------------------------------------------------
-- AUTO-CREATE USER PROFILE ON SIGN-UP
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- MEMBER COUNT SYNC (communities)
-- ---------------------------------------------------------------------------

create or replace function public.sync_community_member_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.communities
    set member_count = member_count + 1
    where id = new.community_id;
  elsif (tg_op = 'DELETE') then
    update public.communities
    set member_count = greatest(member_count - 1, 0)
    where id = old.community_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_community_member_change on public.community_members;
create trigger on_community_member_change
  after insert or delete on public.community_members
  for each row execute procedure public.sync_community_member_count();
