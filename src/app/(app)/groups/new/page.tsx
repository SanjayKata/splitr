"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateGroup } from "@/hooks/use-groups";
import {
  createGroupSchema,
  type CreateGroupValues,
} from "@/lib/validation/group";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";

export default function NewGroupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { currency: DEFAULT_CURRENCY },
  });

  const createGroup = useCreateGroup();

  function onSubmit(values: CreateGroupValues) {
    setFormError(null);
    createGroup.mutate(values, {
      onSuccess: (group) => router.replace(`/group?id=${group.id}`),
      onError: (err) =>
        setFormError(
          err instanceof Error ? err.message : "Failed to create group",
        ),
    });
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <Link
        href="/groups"
        className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
      >
        ← Back to groups
      </Link>
      <h1 className="mt-4 mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        New group
      </h1>

      <Card>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          <Field label="Group name" htmlFor="name" error={errors.name?.message}>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Goa Trip, Apartment, Office lunch"
              autoFocus
              invalid={!!errors.name}
              {...register("name")}
            />
          </Field>

          <Field
            label="Currency"
            htmlFor="currency"
            error={errors.currency?.message}
          >
            <Select
              id="currency"
              invalid={!!errors.currency}
              {...register("currency")}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </Select>
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {formError}
            </p>
          )}

          <Button
            type="submit"
            loading={createGroup.isPending}
            className="mt-1"
          >
            Create group
          </Button>
        </form>
      </Card>
    </main>
  );
}
