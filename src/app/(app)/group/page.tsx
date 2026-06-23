"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/auth-provider";
import {
  useAddMember,
  useGroup,
  useMembers,
  useRemoveMember,
} from "@/hooks/use-groups";
import { addMemberSchema, type AddMemberValues } from "@/lib/validation/group";
import { ExpensesSection } from "@/components/expenses/expenses-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function GroupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 justify-center py-16">
          <Spinner className="h-6 w-6 text-emerald-600" />
        </div>
      }
    >
      <GroupPageContent />
    </Suspense>
  );
}

function GroupPageContent() {
  const groupId = useSearchParams().get("id");
  const { user } = useAuth();

  const groupQuery = useGroup(groupId);
  const membersQuery = useMembers(groupId);

  if (!groupId) {
    return <ErrorView message="No group specified" />;
  }
  if (groupQuery.isPending) {
    return (
      <div className="flex flex-1 justify-center py-16">
        <Spinner className="h-6 w-6 text-emerald-600" />
      </div>
    );
  }
  if (groupQuery.error) {
    return (
      <ErrorView
        message={
          groupQuery.error instanceof Error
            ? groupQuery.error.message
            : "Failed to load group"
        }
      />
    );
  }
  if (!groupQuery.data) {
    return <ErrorView message="Group not found" />;
  }

  const group = groupQuery.data;
  const members = membersQuery.data ?? [];
  const isOwner = user?.id === group.created_by;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link
        href="/groups"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back to groups
      </Link>

      <div className="mt-4 mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {group.name}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {members.length} {members.length === 1 ? "member" : "members"} ·{" "}
          {group.currency}
        </p>
      </div>

      <section className="mb-6">
        <SectionTitle>Members</SectionTitle>
        <Card className="p-0">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((m) => {
              const name =
                m.profile?.display_name ?? m.profile?.email ?? "Unknown";
              const isYou = m.user_id === user?.id;
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={name} />
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {name}{" "}
                        {isYou && <span className="text-zinc-400">(you)</span>}
                      </p>
                      {m.profile?.email && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {m.profile.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.role === "admin" && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        owner
                      </span>
                    )}
                    {isOwner && m.role !== "admin" && (
                      <RemoveMemberButton
                        groupId={groupId}
                        userId={m.user_id}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      {isOwner && (
        <section className="mb-6">
          <SectionTitle>Add a member</SectionTitle>
          <Card>
            <AddMemberForm groupId={groupId} />
          </Card>
        </section>
      )}

      <ExpensesSection group={group} members={members} />
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
      {children}
    </h2>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {message}
      </p>
      <Link
        href="/groups"
        className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
      >
        ← Back to groups
      </Link>
    </main>
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

function AddMemberForm({ groupId }: { groupId: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddMemberValues>({ resolver: zodResolver(addMemberSchema) });

  const addMember = useAddMember(groupId);

  function onSubmit(values: AddMemberValues) {
    setFormError(null);
    setSuccess(null);
    addMember.mutate(values.email, {
      onSuccess: () => {
        setSuccess(`Added ${values.email}`);
        reset();
      },
      onError: (err) =>
        setFormError(
          err instanceof Error ? err.message : "Failed to add member",
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
        label="Their Splitr email"
        htmlFor="member-email"
        error={errors.email?.message}
      >
        <div className="flex gap-2">
          <Input
            id="member-email"
            type="email"
            placeholder="friend@example.com"
            invalid={!!errors.email}
            {...register("email")}
          />
          <Button type="submit" loading={addMember.isPending}>
            Add
          </Button>
        </div>
      </Field>
      {formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {success}
        </p>
      )}
      <p className="text-xs text-zinc-400">
        They must already have a Splitr account with this email.
      </p>
    </form>
  );
}

function RemoveMemberButton({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const removeMember = useRemoveMember(groupId);

  return (
    <Button
      variant="ghost"
      size="sm"
      loading={removeMember.isPending}
      onClick={() => removeMember.mutate(userId)}
    >
      Remove
    </Button>
  );
}
