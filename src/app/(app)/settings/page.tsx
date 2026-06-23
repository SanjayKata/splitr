"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/auth-provider";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { profileSchema, type ProfileValues } from "@/lib/validation/profile";
import { CURRENCIES } from "@/lib/currencies";
import { requireEmailConfirmation } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { data: profile, isPending } = useProfile();
  const updateProfile = useUpdateProfile();
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) });

  // Populate the form once the profile loads.
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.display_name ?? "",
        defaultCurrency: profile.default_currency,
      });
    }
  }, [profile, reset]);

  function onSubmit(values: ProfileValues) {
    setFormError(null);
    setSaved(false);
    updateProfile.mutate(values, {
      onSuccess: () => setSaved(true),
      onError: (err) =>
        setFormError(err instanceof Error ? err.message : "Failed to save"),
    });
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>

      <h2 className="mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Profile
      </h2>
      <Card>
        {isPending ? (
          <div className="flex justify-center py-6">
            <Spinner className="h-5 w-5 text-emerald-600" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
            noValidate
          >
            <Field label="Email" htmlFor="email">
              <Input id="email" value={user?.email ?? ""} disabled readOnly />
            </Field>
            <Field
              label="Display name"
              htmlFor="displayName"
              error={errors.displayName?.message}
            >
              <Input
                id="displayName"
                invalid={!!errors.displayName}
                {...register("displayName")}
              />
            </Field>
            <Field
              label="Default currency"
              htmlFor="defaultCurrency"
              error={errors.defaultCurrency?.message}
            >
              <Select
                id="defaultCurrency"
                invalid={!!errors.defaultCurrency}
                {...register("defaultCurrency")}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            {formError && (
              <p
                role="alert"
                className="text-sm text-red-600 dark:text-red-400"
              >
                {formError}
              </p>
            )}
            {saved && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Saved
              </p>
            )}
            <Button type="submit" loading={updateProfile.isPending}>
              Save changes
            </Button>
          </form>
        )}
      </Card>

      <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Account
      </h2>
      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            Email confirmation
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {requireEmailConfirmation
              ? "Required at signup"
              : "Off (no emails)"}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={handleSignOut}>
          Sign out
        </Button>
      </Card>
    </main>
  );
}
