-- Splitr — receipt image uploads (M7)
--
-- A private Storage bucket for receipts, with member-only access. Files live at
-- "<group_id>/<uuid>.<ext>", so a user may read/write a receipt only if they
-- belong to that group (checked via is_member_of on the first path segment).
-- Also adds receipt_url to create_expense so an expense + receipt are stored together.
--
-- Apply after 0004: SQL Editor → New query → paste → Run.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts: read group files" on storage.objects;
create policy "receipts: read group files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'receipts'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "receipts: upload to my groups" on storage.objects;
create policy "receipts: upload to my groups"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "receipts: delete group files" on storage.objects;
create policy "receipts: delete group files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and public.is_member_of(((storage.foldername(name))[1])::uuid)
  );

-- Recreate create_expense with a trailing receipt_url parameter.
drop function if exists public.create_expense(
  uuid, text, numeric, text, uuid, text, text, jsonb
);

create or replace function public.create_expense(
  _group_id uuid,
  _description text,
  _amount numeric,
  _currency text,
  _paid_by uuid,
  _category text,
  _split_type text,
  _splits jsonb,
  _receipt_url text default null
)
returns public.expenses
language plpgsql
security definer
set search_path = public
as $$
declare
  _exp public.expenses;
  _sum numeric;
begin
  if not public.is_member_of(_group_id) then
    raise exception 'You are not a member of this group';
  end if;

  select coalesce(sum((s ->> 'owed_amount')::numeric), 0)
    into _sum
  from jsonb_array_elements(_splits) s;

  if round(_sum, 2) <> round(_amount, 2) then
    raise exception 'Splits (%) must sum to the amount (%)', _sum, _amount;
  end if;

  insert into public.expenses (
    group_id, description, amount, currency, paid_by, category,
    receipt_url, split_type, created_by
  )
  values (
    _group_id, _description, _amount, _currency, _paid_by, _category,
    _receipt_url, _split_type, auth.uid()
  )
  returning * into _exp;

  insert into public.expense_splits (expense_id, group_id, user_id, owed_amount)
  select
    _exp.id,
    _group_id,
    (s ->> 'user_id')::uuid,
    (s ->> 'owed_amount')::numeric
  from jsonb_array_elements(_splits) s;

  return _exp;
end;
$$;
