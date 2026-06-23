-- Splitr — initial schema (M1)
-- Tables, row-level security (RLS), and triggers for a Splitwise-style app.
--
-- Apply this in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- (Or via the Supabase CLI: `supabase db push`.)
--
-- Security model: every table has RLS enabled. A user may read/write a row only
-- if they belong to the relevant group. Membership is checked through the
-- SECURITY DEFINER function `is_member_of()` so that policies on `group_members`
-- do not recursively invoke RLS on themselves (a common Postgres/Supabase pitfall).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- One profile per authenticated user (mirrors auth.users).
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  display_name     text,
  email            text,
  default_currency text not null default 'INR',
  created_at       timestamptz not null default now()
);

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(trim(name)) > 0),
  currency   text not null default 'INR',
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

-- Who belongs to a group. A person must have an account (user_id) to be a member.
create table if not exists public.group_members (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  role      text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.groups (id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  amount      numeric(14, 2) not null check (amount > 0),
  currency    text not null,
  paid_by     uuid not null references auth.users (id),
  category    text,
  receipt_url text,
  split_type  text not null default 'equal'
    check (split_type in ('equal', 'exact', 'percent', 'shares')),
  created_by  uuid not null references auth.users (id),
  created_at  timestamptz not null default now()
);

-- One row per participant per expense: how much that person owes for it.
-- group_id is denormalized from the parent expense so RLS can check membership
-- directly without an extra subquery/join.
create table if not exists public.expense_splits (
  id           uuid primary key default gen_random_uuid(),
  expense_id   uuid not null references public.expenses (id) on delete cascade,
  group_id     uuid not null references public.groups (id) on delete cascade,
  user_id      uuid not null references auth.users (id),
  owed_amount  numeric(14, 2) not null check (owed_amount >= 0),
  unique (expense_id, user_id)
);

-- A recorded payment from one member to another to settle debts.
create table if not exists public.settlements (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups (id) on delete cascade,
  from_user  uuid not null references auth.users (id),
  to_user    uuid not null references auth.users (id),
  amount     numeric(14, 2) not null check (amount > 0),
  currency   text not null,
  note       text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

-- ---------------------------------------------------------------------------
-- Indexes (on foreign keys used by RLS and common queries)
-- ---------------------------------------------------------------------------
create index if not exists idx_group_members_user  on public.group_members (user_id);
create index if not exists idx_group_members_group on public.group_members (group_id);
create index if not exists idx_expenses_group       on public.expenses (group_id);
create index if not exists idx_expense_splits_group on public.expense_splits (group_id);
create index if not exists idx_expense_splits_exp   on public.expense_splits (expense_id);
create index if not exists idx_settlements_group    on public.settlements (group_id);

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER avoids recursive RLS on group_members)
-- ---------------------------------------------------------------------------
create or replace function public.is_member_of(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = _group_id
      and gm.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Create a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- When a group is created, make the creator its first member (admin).
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin')
  on conflict (group_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

-- profiles: a user manages their own profile; members can read each other's
-- profiles within shared groups (needed to show names on expenses/balances).
create policy "profiles: read own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: read group peers"
  on public.profiles for select
  using (
    exists (
      select 1
      from public.group_members me
      join public.group_members peer on peer.group_id = me.group_id
      where me.user_id = auth.uid()
        and peer.user_id = profiles.id
    )
  );

create policy "profiles: insert own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- groups: members can read; any authenticated user can create a group they own;
-- only the creator can modify/delete it.
create policy "groups: read if member"
  on public.groups for select
  using (is_member_of(id) or created_by = auth.uid());

create policy "groups: insert own"
  on public.groups for insert
  with check (created_by = auth.uid());

create policy "groups: update by creator"
  on public.groups for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "groups: delete by creator"
  on public.groups for delete
  using (created_by = auth.uid());

-- group_members: members can see the roster; the group creator manages members;
-- a user may remove themselves.
create policy "members: read if member"
  on public.group_members for select
  using (is_member_of(group_id));

create policy "members: insert by group creator"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

create policy "members: delete by creator or self"
  on public.group_members for delete
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );

-- expenses: any group member can read and write.
create policy "expenses: read if member"
  on public.expenses for select
  using (is_member_of(group_id));

create policy "expenses: insert if member"
  on public.expenses for insert
  with check (is_member_of(group_id) and created_by = auth.uid());

create policy "expenses: update if member"
  on public.expenses for update
  using (is_member_of(group_id))
  with check (is_member_of(group_id));

create policy "expenses: delete if member"
  on public.expenses for delete
  using (is_member_of(group_id));

-- expense_splits: gated by the denormalized group_id.
create policy "splits: read if member"
  on public.expense_splits for select
  using (is_member_of(group_id));

create policy "splits: insert if member"
  on public.expense_splits for insert
  with check (is_member_of(group_id));

create policy "splits: update if member"
  on public.expense_splits for update
  using (is_member_of(group_id))
  with check (is_member_of(group_id));

create policy "splits: delete if member"
  on public.expense_splits for delete
  using (is_member_of(group_id));

-- settlements: any group member can read and record payments.
create policy "settlements: read if member"
  on public.settlements for select
  using (is_member_of(group_id));

create policy "settlements: insert if member"
  on public.settlements for insert
  with check (is_member_of(group_id) and created_by = auth.uid());

create policy "settlements: update if member"
  on public.settlements for update
  using (is_member_of(group_id))
  with check (is_member_of(group_id));

create policy "settlements: delete if member"
  on public.settlements for delete
  using (is_member_of(group_id));
