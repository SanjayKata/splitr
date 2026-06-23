-- Splitr — atomic expense creation (M4)
--
-- An expense and its per-member splits must be written together. This function
-- inserts both in a single transaction, after verifying the caller is a group
-- member and that the splits sum to the expense amount.
--
-- The split amounts themselves are computed in the app (tested TypeScript) and
-- passed in as JSON: [{ "user_id": "...", "owed_amount": 3.34 }, ...].
--
-- Apply after 0002: SQL Editor → New query → paste → Run.

create or replace function public.create_expense(
  _group_id uuid,
  _description text,
  _amount numeric,
  _currency text,
  _paid_by uuid,
  _category text,
  _split_type text,
  _splits jsonb
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
    group_id, description, amount, currency, paid_by, category, split_type, created_by
  )
  values (
    _group_id, _description, _amount, _currency, _paid_by, _category, _split_type, auth.uid()
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
