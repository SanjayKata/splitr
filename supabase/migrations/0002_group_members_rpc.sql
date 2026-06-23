-- Splitr — group membership management (M3)
--
-- Adding a member means looking someone up by email, but RLS deliberately
-- prevents a user from reading arbitrary profiles. So membership changes go
-- through SECURITY DEFINER functions that (a) verify the caller owns the group
-- and (b) perform the lookup/insert with elevated rights.
--
-- Apply after 0001_init.sql: SQL Editor → New query → paste → Run.

-- Add an existing Splitr user to a group by their email.
create or replace function public.add_group_member(_group_id uuid, _email text)
returns public.group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid;
  _row public.group_members;
begin
  -- Only the group owner may add members.
  if not exists (
    select 1 from public.groups g
    where g.id = _group_id and g.created_by = auth.uid()
  ) then
    raise exception 'Only the group owner can add members';
  end if;

  select id into _uid
  from public.profiles
  where lower(email) = lower(trim(_email));

  if _uid is null then
    raise exception 'No Splitr account found for %', _email
      using errcode = 'no_data_found';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (_group_id, _uid, 'member')
  on conflict (group_id, user_id) do nothing
  returning * into _row;

  -- Already a member: return the existing row.
  if _row.id is null then
    select * into _row
    from public.group_members
    where group_id = _group_id and user_id = _uid;
  end if;

  return _row;
end;
$$;

-- Remove a member from a group (owner only; owner cannot remove themselves here).
create or replace function public.remove_group_member(_group_id uuid, _user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.groups g
    where g.id = _group_id and g.created_by = auth.uid()
  ) then
    raise exception 'Only the group owner can remove members';
  end if;

  if _user_id = auth.uid() then
    raise exception 'The group owner cannot remove themselves';
  end if;

  delete from public.group_members
  where group_id = _group_id and user_id = _user_id;
end;
$$;
