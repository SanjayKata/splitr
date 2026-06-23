"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { useFriends } from "@/hooks/use-friends";
import { useGroups, useMembers } from "@/hooks/use-groups";
import { useAddExpenseForTarget } from "@/hooks/use-expenses";
import type { ExpenseTarget } from "@/services/expenses.service";
import { computeShares, type SplitEntry } from "@/lib/split";
import { formatMoney } from "@/lib/money";
import { CATEGORIES } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { SplitType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;

const SPLIT_TYPES: { key: SplitType; label: string }[] = [
  { key: "equal", label: "Equally" },
  { key: "exact", label: "By amount" },
  { key: "percent", label: "By %" },
];

/** Format a leftover-to-allocate value as a percentage or a money amount. */
function formatAlloc(
  value: number,
  splitType: SplitType,
  currency?: string,
): string {
  if (splitType === "percent") return `${value}%`;
  return currency ? formatMoney(value, currency) : value.toFixed(2);
}

export default function NewExpensePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      }
    >
      <NewExpenseForm />
    </Suspense>
  );
}

function NewExpenseForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const friendsQuery = useFriends();
  const groupsQuery = useGroups();
  const addExpense = useAddExpenseForTarget();

  // Preselect from ?group= / ?friend= (e.g. coming from a group page).
  const [splitWith, setSplitWith] = useState(() => {
    const g = params.get("group");
    const f = params.get("friend");
    if (g) return `g:${g}`;
    if (f) return `f:${f}`;
    return "";
  });
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("general");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const target: ExpenseTarget | null = useMemo(() => {
    if (splitWith.startsWith("g:"))
      return { type: "group", groupId: splitWith.slice(2) };
    if (splitWith.startsWith("f:"))
      return { type: "friend", friendId: splitWith.slice(2) };
    return null;
  }, [splitWith]);

  const membersQuery = useMembers(
    target?.type === "group" ? target.groupId : null,
  );

  // Participants (who the bill is split between) + their display names.
  const participants = useMemo(() => {
    if (!target || !user) return [];
    if (target.type === "friend") {
      const friend = friendsQuery.data?.find(
        (f) => f.userId === target.friendId,
      );
      return [
        { id: user.id, name: "You" },
        {
          id: target.friendId,
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
  }, [target, user, friendsQuery.data, membersQuery.data]);

  const effectivePaidBy = participants.some((p) => p.id === paidBy)
    ? paidBy
    : (user?.id ?? "");

  const targetCurrency =
    target?.type === "group"
      ? groupsQuery.data?.find((g) => g.id === target.groupId)?.currency
      : undefined;

  const amountValid = AMOUNT_RE.test(amount.trim()) && Number(amount) > 0;

  // Live preview/validation of the split.
  const entries: SplitEntry[] = participants.map((p) => ({
    userId: p.id,
    value: Number(values[p.id] ?? "") || 0,
  }));
  let splitError: string | null = null;
  let preview: Map<string, number> | null = null;
  if (target && amountValid && participants.length > 0) {
    try {
      const shares = computeShares(Number(amount), splitType, entries);
      preview = new Map(shares.map((s) => [s.userId, s.owedAmount]));
    } catch (err) {
      splitError = err instanceof Error ? err.message : "Invalid split";
    }
  }

  // How much is left to allocate (for "By amount" / "By %"), so users don't
  // have to do the math themselves.
  const enteredSum = entries.reduce((s, e) => s + (e.value ?? 0), 0);
  const allocTarget = splitType === "percent" ? 100 : Number(amount) || 0;
  const remaining = Math.round((allocTarget - enteredSum) * 100) / 100;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const next: Record<string, string> = {};
    if (!target) next.splitWith = "Choose a friend or group";
    if (!description.trim()) next.description = "Description is required";
    if (!amountValid) next.amount = "Enter a valid amount";
    if (!effectivePaidBy) next.paidBy = "Choose who paid";
    setErrors(next);
    if (Object.keys(next).length > 0 || !target || splitError) return;

    addExpense.mutate(
      {
        target,
        description: description.trim(),
        amount: Number(amount),
        paidBy: effectivePaidBy,
        category: category.trim() || null,
        splitType,
        entries,
        receiptFile,
      },
      {
        onSuccess: () =>
          router.replace(
            target.type === "group"
              ? `/group?id=${target.groupId}`
              : "/friends",
          ),
        onError: (err) =>
          setFormError(
            err instanceof Error ? err.message : "Failed to add expense",
          ),
      },
    );
  }

  const friends = friendsQuery.data ?? [];
  const groups = groupsQuery.data ?? [];
  const unit =
    splitType === "exact"
      ? (targetCurrency ?? "")
      : splitType === "percent"
        ? "%"
        : "";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <Link
        href="/friends"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Add expense
      </h1>

      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field
            label="Split with"
            htmlFor="splitWith"
            error={errors.splitWith}
          >
            <Select
              id="splitWith"
              value={splitWith}
              invalid={!!errors.splitWith}
              onChange={(e) => setSplitWith(e.target.value)}
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

          <Field
            label="Description"
            htmlFor="description"
            error={errors.description}
          >
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner, Taxi"
              invalid={!!errors.description}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
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
            <Field label="Paid by" htmlFor="paidBy" error={errors.paidBy}>
              <Select
                id="paidBy"
                value={effectivePaidBy}
                invalid={!!errors.paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                disabled={!target}
              >
                {participants.length === 0 && <option value="">—</option>}
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {target && participants.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Split
              </p>
              <div className="mb-3 inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
                {SPLIT_TYPES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setSplitType(s.key)}
                    aria-pressed={splitType === s.key}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                      splitType === s.key
                        ? "bg-emerald-600 text-white"
                        : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {splitType === "equal" ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Split equally between {participants.length}{" "}
                  {participants.length === 1 ? "person" : "people"}.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {participants.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          value={values[p.id] ?? ""}
                          onChange={(e) =>
                            setValues((v) => ({ ...v, [p.id]: e.target.value }))
                          }
                          className="h-9 w-24 text-right"
                          placeholder="0"
                        />
                        {unit && (
                          <span className="w-8 text-xs text-zinc-400">
                            {unit}
                          </span>
                        )}
                      </div>
                      <span className="w-20 text-right text-xs text-zinc-500 dark:text-zinc-400">
                        {preview && targetCurrency
                          ? formatMoney(preview.get(p.id) ?? 0, targetCurrency)
                          : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {splitType !== "equal" && amountValid && (
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    remaining === 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {remaining === 0
                    ? "All set — fully allocated"
                    : `${formatAlloc(Math.abs(remaining), splitType, targetCurrency)} ${
                        remaining > 0 ? "left to assign" : "over"
                      }`}
                </p>
              )}

              {splitError && (
                <p
                  role="alert"
                  className="mt-1 text-sm text-red-600 dark:text-red-400"
                >
                  {splitError}
                </p>
              )}
            </div>
          )}

          <Field label="Category" htmlFor="category">
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Receipt (optional)" htmlFor="receipt">
            <input
              id="receipt"
              type="file"
              accept="image/*"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-zinc-500 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-200"
            />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            loading={addExpense.isPending}
            disabled={!!splitError}
            className="mt-1"
          >
            Add expense
          </Button>
        </form>
      </Card>
    </main>
  );
}
