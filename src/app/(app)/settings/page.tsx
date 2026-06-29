"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/components/theme-provider";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { profileSchema, type ProfileValues } from "@/lib/validation/profile";
import { CURRENCIES } from "@/lib/currencies";
import { ACCENTS, type Mode } from "@/lib/theme";
import { requireEmailConfirmation } from "@/lib/env";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PushToggle } from "@/components/push-toggle";

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
        Appearance
      </h2>
      <AppearanceSection />

      <h2 className="mt-8 mb-2 text-sm font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Notifications
      </h2>
      <PushToggle />

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

const MODES: { key: Mode; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
];

function AppearanceSection() {
  const { mode, accent, setMode, setAccent } = useTheme();

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Theme
        </p>
        <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
          {MODES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMode(m.key)}
              aria-pressed={mode === m.key}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === m.key
                  ? "bg-emerald-600 text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Accent color
        </p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAccent(a.key)}
              aria-label={a.label}
              aria-pressed={accent === a.key}
              title={a.label}
              className={cn(
                "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-white transition-transform hover:scale-110 dark:ring-offset-zinc-950",
                accent === a.key
                  ? "ring-zinc-900 dark:ring-white"
                  : "ring-transparent",
              )}
              style={{ backgroundColor: a.swatch }}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
