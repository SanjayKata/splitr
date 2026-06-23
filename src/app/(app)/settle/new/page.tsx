"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { useGroups, useMembers } from "@/hooks/use-groups";
import { useRecordSettlement } from "@/hooks/use-settlements";
import type { ExpenseTarget } from "@/services/expenses.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

export default function SettleUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      }
    >
      <SettleUpForm />
    </Suspense>
  );
}

function SettleUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const friendsQuery = useFriends();
  const groupsQuery = useGroups();
  const settle = useRecordSettlement();

  const [target, setTarget] = useState(() => {
    const g = params.get("group");
    const f = params.get("friend");
    if (g) return `g:${g}`;
    if (f) return `f:${f}`;
    return "";
  });
  const [fromUser, setFromUser] = useState(() => params.get("from") ?? "");
  const [toUser, setToUser] = useState(() => params.get("to") ?? "");
  const [amount, setAmount] = useState(() => params.get("amount") ?? "");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const parsedTarget: ExpenseTarget | null = useMemo(() => {
    if (target.startsWith("g:"))
      return { type: "group", groupId: target.slice(2) };
    if (target.startsWith("f:"))
      return { type: "friend", friendId: target.slice(2) };
    return null;
  }, [target]);

  const membersQuery = useMembers(
    parsedTarget?.type === "group" ? parsedTarget.groupId : null,
  );

  const people = useMemo(() => {
    if (!parsedTarget || !user) return [];
    if (parsedTarget.type === "friend") {
      const friend = friendsQuery.data?.find(
        (f) => f.userId === parsedTarget.friendId,
      );
      return [
        { id: user.id, name: "You" },
        {
          id: parsedTarget.friendId,
          name:
            friend?.profile?.display_name ?? friend?.profile?.email ?? "Friend",
        },
      ];
    }
    return (membersQuery.data ?? []).map((m) => ({
      id: m.user_id,
      name:
        m.user_id === user.id
          ? "You"
          : (m.profile?.display_name ?? m.profile?.email ?? "Member"),
    }));
  }, [parsedTarget, user, friendsQuery.data, membersQuery.data]);

  // Derived defaults: you pay by default; recipient is the first other person.
  const effectiveFrom = people.some((p) => p.id === fromUser)
    ? fromUser
    : (user?.id ?? "");
  const effectiveTo =
    people.some((p) => p.id === toUser) && toUser !== effectiveFrom
      ? toUser
      : (people.find((p) => p.id !== effectiveFrom)?.id ?? "");

  const targetCurrency =
    parsedTarget?.type === "group"
      ? groupsQuery.data?.find((g) => g.id === parsedTarget.groupId)?.currency
      : undefined;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const next: Record<string, string> = {};
    if (!parsedTarget) next.target = "Choose a friend or group";
    if (!(AMOUNT_RE.test(amount.trim()) && Number(amount) > 0))
      next.amount = "Enter a valid amount";
    if (effectiveFrom && effectiveFrom === effectiveTo)
      next.people = "Payer and recipient must differ";
    if (!effectiveFrom || !effectiveTo) next.people = "Choose both people";
    setErrors(next);
    if (Object.keys(next).length > 0 || !parsedTarget) return;

    settle.mutate(
      {
        target: parsedTarget,
        fromUser: effectiveFrom,
        toUser: effectiveTo,
        amount: Number(amount),
        note: note.trim() || null,
      },
      {
        onSuccess: () =>
          router.replace(
            parsedTarget.type === "group"
              ? `/group?id=${parsedTarget.groupId}`
              : "/friends",
          ),
        onError: (err) =>
          setFormError(
            err instanceof Error ? err.message : "Failed to record payment",
          ),
      },
    );
  }

  const friends = friendsQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <Link
        href="/friends"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Settle up
      </h1>

      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="In" htmlFor="target" error={errors.target}>
            <Select
              id="target"
              value={target}
              invalid={!!errors.target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Select a friend or group…</option>
              {friends.length > 0 && (
                <optgroup label="Friends (non-group)">
                  {friends.map((f) => (
                    <option key={f.userId} value={`f:${f.userId}`}>
                      {f.profile?.display_name ?? f.profile?.email ?? "Friend"}
                    </option>
                  ))}
                </optgroup>
              )}
              {groups.length > 0 && (
                <optgroup label="Groups">
                  {groups.map((g) => (
                    <option key={g.id} value={`g:${g.id}`}>
                      {g.name} ({g.currency})
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="From (payer)" htmlFor="from" error={errors.people}>
              <Select
                id="from"
                value={effectiveFrom}
                onChange={(e) => setFromUser(e.target.value)}
                disabled={!parsedTarget}
              >
                {people.length === 0 && <option value="">—</option>}
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="To (recipient)" htmlFor="to">
              <Select
                id="to"
                value={effectiveTo}
                onChange={(e) => setToUser(e.target.value)}
                disabled={!parsedTarget}
              >
                {people.length === 0 && <option value="">—</option>}
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Field
            label={`Amount${targetCurrency ? ` (${targetCurrency})` : ""}`}
            htmlFor="amount"
            error={errors.amount}
          >
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              invalid={!!errors.amount}
            />
          </Field>

          <Field label="Note (optional)" htmlFor="note">
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. UPI, cash"
            />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <Button type="submit" loading={settle.isPending} className="mt-1">
            Record payment
          </Button>
        </form>
      </Card>
    </main>
  );
}
