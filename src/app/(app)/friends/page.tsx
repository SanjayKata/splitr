"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFriends, useAddFriend } from "@/hooks/use-friends";
import { useOverview } from "@/hooks/use-overview";
import { addFriendSchema, type AddFriendValues } from "@/lib/validation/friend";
import type { FriendCurrencyBalance } from "@/lib/overview";
import type { ProfileSummary } from "@/repositories/profiles.repository";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type Filter = "all" | "owe" | "owed" | "settled";

interface FriendItem {
  userId: string;
  profile: ProfileSummary | null;
  balances: FriendCurrencyBalance[];
}

export default function FriendsPage() {
  const friendsQuery = useFriends();
  const overviewQuery = useOverview();
  const [filter, setFilter] = useState<Filter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [search, setSearch] = useState("");

  const items: FriendItem[] = useMemo(() => {
    const balById = new Map(
      overviewQuery.data?.friends.map((f) => [f.friendId, f.balances]) ?? [],
    );
    return (friendsQuery.data ?? []).map((f) => ({
      userId: f.userId,
      profile: f.profile,
      balances: balById.get(f.userId) ?? [],
    }));
  }, [friendsQuery.data, overviewQuery.data]);

  const query = search.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (filter === "owed" && !it.balances.some((b) => b.net > 0)) return false;
    if (filter === "owe" && !it.balances.some((b) => b.net < 0)) return false;
    if (filter === "settled" && it.balances.length > 0) return false;
    if (query) {
      const name = `${it.profile?.display_name ?? ""} ${it.profile?.email ?? ""}`;
      if (!name.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  const isPending = friendsQuery.isPending || overviewQuery.isPending;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Friends
        </h1>
        <div className="flex items-center gap-1.5">
          <IconButton
            label="Search friends"
            active={searching}
            onClick={() => {
              setSearching((v) => !v);
              if (searching) setSearch("");
            }}
          >
            <path d="m21 21-4.3-4.3" />
            <circle cx="11" cy="11" r="7" />
          </IconButton>
          <IconButton
            label="Filter"
            active={filter !== "all"}
            onClick={() => setFilterOpen(true)}
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </IconButton>
          <IconButton
            label="Add friend"
            active={adding}
            onClick={() => setAdding((v) => !v)}
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
          </IconButton>
          <Link href="/settle/new">
            <Button size="sm">Settle up</Button>
          </Link>
        </div>
      </div>

      {searching && (
        <Input
          autoFocus
          placeholder="Search friends by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />
      )}

      {adding && (
        <Card className="mb-4">
          <AddFriendForm onDone={() => setAdding(false)} />
        </Card>
      )}

      <FilterSheet
        open={filterOpen}
        value={filter}
        onChange={setFilter}
        onClose={() => setFilterOpen(false)}
      />

      {overviewQuery.data && overviewQuery.data.totals.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {overviewQuery.data.totals.map((t) => (
            <Card
              key={t.currency}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You are owed ({t.currency})
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(t.youAreOwed, t.currency)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You owe
                </p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {formatMoney(t.youOwe, t.currency)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isPending ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
          <p className="text-zinc-700 dark:text-zinc-300">
            {items.length === 0 ? "No friends yet" : "Nothing to show"}
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {items.length === 0
              ? "Add a friend to start splitting expenses."
              : "Try a different filter."}
          </p>
        </div>
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((item) => (
              <FriendItemRow key={item.userId} item={item} />
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}

const FILTER_OPTIONS: { key: Filter; label: string; hint: string }[] = [
  { key: "all", label: "All", hint: "Everyone" },
  { key: "owe", label: "You owe", hint: "Friends you owe money" },
  { key: "owed", label: "You are owed", hint: "Friends who owe you" },
  { key: "settled", label: "Settled up", hint: "No outstanding balance" },
];

/** Bottom-sheet filter picker (keeps the header compact on small screens). */
function FilterSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: Filter;
  onChange: (f: Filter) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close filter"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-zinc-200 bg-white p-4 pb-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <h2 className="mb-3 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Show
          </h2>
          <ul className="flex flex-col gap-1">
            {FILTER_OPTIONS.map((o) => {
              const selected = value === o.key;
              return (
                <li key={o.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.key);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors",
                      selected
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900",
                    )}
                  >
                    <span>
                      <span
                        className={cn(
                          "block text-sm font-medium",
                          selected
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {o.label}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {o.hint}
                      </span>
                    </span>
                    {selected && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
        active
          ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
          : "border-zinc-200 text-zinc-500 hover:text-zinc-800 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-100",
      )}
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

function FriendItemRow({ item }: { item: FriendItem }) {
  const name = item.profile?.display_name ?? item.profile?.email ?? "Someone";
  const settled = item.balances.length === 0;
  const [open, setOpen] = useState(false);

  return (
    <li className="px-5 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} />
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {name}
          </span>
          {/* Quick actions beside the name */}
          <ActionIcon
            href={`/expenses/new?friend=${item.userId}`}
            label={`Add expense with ${name}`}
          >
            <path d="M12 5v14M5 12h14" />
          </ActionIcon>
          {!settled && (
            <ActionIcon
              href={`/settle/new?friend=${item.userId}`}
              label={`Settle up with ${name}`}
            >
              <path d="M7 10h10l-3-3M17 14H7l3 3" />
            </ActionIcon>
          )}
        </div>

        <div className="flex items-center gap-2">
          {settled ? (
            <span className="text-sm text-zinc-400">settled up</span>
          ) : (
            <span className="flex flex-col items-end">
              {item.balances.map((b) => (
                <BalanceText key={b.currency} balance={b} />
              ))}
            </span>
          )}
          {!settled && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Show breakdown"
              aria-expanded={open}
              className={cn(
                "text-zinc-300 transition-transform dark:text-zinc-600",
                open && "rotate-90",
              )}
            >
              ›
            </button>
          )}
        </div>
      </div>

      {open && !settled && (
        <div className="mt-2 space-y-1 pl-11">
          {item.balances.flatMap((b) =>
            b.groups.map((g) => (
              <div
                key={`${b.currency}-${g.groupId}`}
                className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400"
              >
                <span>{g.groupName}</span>
                <span
                  className={g.net >= 0 ? "text-emerald-600" : "text-red-600"}
                >
                  {g.net >= 0 ? "owes you " : "you owe "}
                  {formatMoney(Math.abs(g.net), b.currency)}
                </span>
              </div>
            )),
          )}
        </div>
      )}
    </li>
  );
}

/** Small circular icon link used for the per-friend quick actions. */
function ActionIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-emerald-400"
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </Link>
  );
}

function BalanceText({ balance }: { balance: FriendCurrencyBalance }) {
  const owed = balance.net > 0;
  return (
    <span
      className={
        owed
          ? "text-sm font-semibold text-emerald-600 dark:text-emerald-400"
          : "text-sm font-semibold text-red-600 dark:text-red-400"
      }
    >
      {owed ? "owes you " : "you owe "}
      {formatMoney(Math.abs(balance.net), balance.currency)}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
      {initial}
    </span>
  );
}

function AddFriendForm({ onDone }: { onDone: () => void }) {
  const addFriend = useAddFriend();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFriendValues>({ resolver: zodResolver(addFriendSchema) });

  function onSubmit(values: AddFriendValues) {
    setFormError(null);
    addFriend.mutate(values.email, {
      onSuccess: () => onDone(),
      onError: (err) =>
        setFormError(
          err instanceof Error ? err.message : "Failed to add friend",
        ),
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-3"
      noValidate
    >
      <Field
        label="Friend's Splitr email"
        htmlFor="friend-email"
        error={errors.email?.message}
      >
        <div className="flex gap-2">
          <Input
            id="friend-email"
            type="email"
            placeholder="friend@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
          <Button type="submit" loading={addFriend.isPending}>
            Add
          </Button>
        </div>
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}
      <p className="text-xs text-zinc-400">
        They must already have a Splitr account with this email.
      </p>
    </form>
  );
}
