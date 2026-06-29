-- Splitr — in-app notifications (realtime)
--
-- A notification is created server-side (via triggers) for each member affected
-- by a new expense or settlement — never the actor themselves. Clients can only
-- read/mark-read their own; they cannot insert (triggers run as SECURITY DEFINER).
-- The table is added to the realtime publication so the app gets them live.
--
-- Apply after 0005: SQL Editor → New query → paste → Run.

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('expense', 'settlement')),
  actor_name  text not null,
  group_id    uuid references public.groups (id) on delete cascade,
  group_name  text,
  title       text,
  amount      numeric(14, 2),
  currency    text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_user
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: read own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications: update own"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications: delete own"
  on public.notifications for delete
  using (user_id = auth.uid());
-- (No insert policy: only the SECURITY DEFINER triggers below create rows.)

-- One notification per expense participant (except the person who added it).
create or replace function public.notify_expense_split()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _exp public.expenses;
  _actor text;
  _gname text;
begin
  select * into _exp from public.expenses where id = new.expense_id;
  if _exp.created_by = new.user_id then
    return new; -- don't notify the creator
  end if;

  select coalesce(display_name, split_part(email, '@', 1), 'Someone')
    into _actor from public.profiles where id = _exp.created_by;
  select name into _gname from public.groups where id = _exp.group_id;

  insert into public.notifications (
    user_id, kind, actor_name, group_id, group_name, title, amount, currency
  )
  values (
    new.user_id, 'expense', coalesce(_actor, 'Someone'), _exp.group_id, _gname,
    _exp.description, _exp.amount, _exp.currency
  );
  return new;
end;
$$;

drop trigger if exists on_expense_split_created on public.expense_splits;
create trigger on_expense_split_created
  after insert on public.expense_splits
  for each row execute function public.notify_expense_split();

-- Notify the other party when a settlement is recorded.
create or replace function public.notify_settlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _actor text;
  _gname text;
  _recipient uuid;
begin
  -- The party who isn't the one recording it gets notified.
  _recipient := case
    when new.created_by = new.from_user then new.to_user
    else new.from_user
  end;
  if _recipient = new.created_by then
    return new;
  end if;

  select coalesce(display_name, split_part(email, '@', 1), 'Someone')
    into _actor from public.profiles where id = new.created_by;
  select name into _gname from public.groups where id = new.group_id;

  insert into public.notifications (
    user_id, kind, actor_name, group_id, group_name, title, amount, currency
  )
  values (
    _recipient, 'settlement', coalesce(_actor, 'Someone'), new.group_id, _gname,
    new.note, new.amount, new.currency
  );
  return new;
end;
$$;

drop trigger if exists on_settlement_created on public.settlements;
create trigger on_settlement_created
  after insert on public.settlements
  for each row execute function public.notify_settlement();

-- Stream inserts/updates to the app in realtime.
alter publication supabase_realtime add table public.notifications;
