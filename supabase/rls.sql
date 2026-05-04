-- =============================================================================
-- Groove — Row Level Security Policies
-- Run AFTER schema.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enable RLS on all tables
-- ---------------------------------------------------------------------------
alter table public.users             enable row level security;
alter table public.habits            enable row level security;
alter table public.check_ins         enable row level security;
alter table public.follows           enable row level security;
alter table public.communities       enable row level security;
alter table public.community_members enable row level security;
alter table public.reactions         enable row level security;

-- ---------------------------------------------------------------------------
-- USERS
-- Anyone can read profiles (public grid). Only owner can update own profile.
-- ---------------------------------------------------------------------------
drop policy if exists "Users are publicly readable" on public.users;
create policy "Users are publicly readable"
  on public.users for select
  using (true);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- HABITS
-- Habits are publicly readable so followers can see your habits.
-- Only owner can insert/update/delete.
-- ---------------------------------------------------------------------------
drop policy if exists "Habits are publicly readable" on public.habits;
create policy "Habits are publicly readable"
  on public.habits for select
  using (true);

drop policy if exists "Users can manage own habits" on public.habits;
create policy "Users can manage own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own habits" on public.habits;
create policy "Users can update own habits"
  on public.habits for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own habits" on public.habits;
create policy "Users can delete own habits"
  on public.habits for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CHECK-INS
-- Check-ins are publicly readable (grid data). Only owner can write.
-- ---------------------------------------------------------------------------
drop policy if exists "Check-ins are publicly readable" on public.check_ins;
create policy "Check-ins are publicly readable"
  on public.check_ins for select
  using (true);

drop policy if exists "Users can insert own check-ins" on public.check_ins;
create policy "Users can insert own check-ins"
  on public.check_ins for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own check-ins" on public.check_ins;
create policy "Users can update own check-ins"
  on public.check_ins for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own check-ins" on public.check_ins;
create policy "Users can delete own check-ins"
  on public.check_ins for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- FOLLOWS
-- Anyone authenticated can read follows. Users manage own follow relationships.
-- ---------------------------------------------------------------------------
drop policy if exists "Follows are publicly readable" on public.follows;
create policy "Follows are publicly readable"
  on public.follows for select
  using (true);

drop policy if exists "Users can follow others" on public.follows;
create policy "Users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ---------------------------------------------------------------------------
-- COMMUNITIES
-- Communities are publicly readable. Any authenticated user can create.
-- Only creator can update/delete.
-- ---------------------------------------------------------------------------
drop policy if exists "Communities are publicly readable" on public.communities;
create policy "Communities are publicly readable"
  on public.communities for select
  using (true);

drop policy if exists "Authenticated users can create communities" on public.communities;
create policy "Authenticated users can create communities"
  on public.communities for insert
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can update their community" on public.communities;
create policy "Creators can update their community"
  on public.communities for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

drop policy if exists "Creators can delete their community" on public.communities;
create policy "Creators can delete their community"
  on public.communities for delete
  using (auth.uid() = creator_id);

-- ---------------------------------------------------------------------------
-- COMMUNITY MEMBERS
-- Readable by all. Users manage own membership.
-- ---------------------------------------------------------------------------
drop policy if exists "Community members are publicly readable" on public.community_members;
create policy "Community members are publicly readable"
  on public.community_members for select
  using (true);

drop policy if exists "Users can join communities" on public.community_members;
create policy "Users can join communities"
  on public.community_members for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can leave communities" on public.community_members;
create policy "Users can leave communities"
  on public.community_members for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- REACTIONS
-- Readable by all. Users manage own reactions.
-- ---------------------------------------------------------------------------
drop policy if exists "Reactions are publicly readable" on public.reactions;
create policy "Reactions are publicly readable"
  on public.reactions for select
  using (true);

drop policy if exists "Users can add reactions" on public.reactions;
create policy "Users can add reactions"
  on public.reactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove own reactions" on public.reactions;
create policy "Users can remove own reactions"
  on public.reactions for delete
  using (auth.uid() = user_id);
