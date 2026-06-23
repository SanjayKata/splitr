-- Splitr — friends & non-group expenses (via "direct" groups)
--
-- A friendship is modeled as a hidden 2-person group (is_direct = true). This
-- lets non-group ("ungrouped") expenses reuse all existing group machinery —
-- RLS, splits, balances, history — with no policy changes. Direct groups are
-- simply hidden from the Groups tab and surfaced under Friends.
--
-- Apply after 0003: SQL Editor → New query → paste → Run.

alter table public.groups
  add column if not exists is_direct boolean not null default false;

-- Find (or create) the direct group between the caller and a friend.
create or replace function public.ensure_direct_group(_friend_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _gid uuid;
  _currency text;
begin
  if _friend_id = auth.uid() then
    raise exception 'You cannot add yourself';
  end if;

  -- Existing direct group containing exactly the two of us?
  select g.id into _gid
  from public.groups g
  where g.is_direct
    and exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = auth.uid()
    )
    and exists (
      select 1 from public.group_members m
      where m.group_id = g.id and m.user_id = _friend_id
    )
  limit 1;

  if _gid is not null then
    return _gid;
  end if;

  select coalesce(default_currency, 'USD') into _currency
  from public.profiles where id = auth.uid();

  insert into public.groups (name, currency, created_by, is_direct)
  values ('Direct', coalesce(_currency, 'USD'), auth.uid(), true)
  returning id into _gid;

  -- The creator is added as admin by the on_group_created trigger; add the friend.
  insert into public.group_members (group_id, user_id, role)
  values (_gid, _friend_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return _gid;
end;
$$;

-- Add a friend by email → ensures a direct group exists, returns its id.
create or replace function public.add_friend(_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _fid uuid;
begin
  select id into _fid
  from public.profiles
  where lower(email) = lower(trim(_email));

  if _fid is null then
    raise exception 'No Splitr account found for %', _email
      using errcode = 'no_data_found';
  end if;

  return public.ensure_direct_group(_fid);
end;
$$;
