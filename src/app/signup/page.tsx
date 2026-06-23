"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthCard } from "@/components/auth/auth-card";
import { signupSchema, type SignupValues } from "@/lib/validation/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { requireEmailConfirmation } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function SignupPage() {
  const { signUp, signIn, user, loading } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (!loading && user) router.replace("/groups");
  }, [loading, user, router]);

  async function onSubmit(values: SignupValues) {
    setFormError(null);
    try {
      const { needsEmailConfirmation } = await signUp(values);

      // Got a session straight away (Supabase confirmation off) → go in.
      if (!needsEmailConfirmation) {
        router.replace("/groups");
        return;
      }

      // No session. If the app requires confirmation, show the email step.
      if (requireEmailConfirmation) {
        setConfirmEmail(true);
        return;
      }

      // App doesn't require confirmation — try signing in immediately.
      try {
        await signIn(values.email, values.password);
        router.replace("/groups");
      } catch {
        setConfirmEmail(true); // Supabase still requires it; fall back.
      }
    } catch (err) {
      setFormError(authErrorMessage(err));
    }
  }

  if (confirmEmail) {
    return (
      <AuthCard
        title="Check your email"
        subtitle="We sent you a confirmation link"
        footer={
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            Back to sign in
          </Link>
        }
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Click the link in the email to activate your account, then sign in.
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start splitting expenses with friends"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-emerald-600 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <Field
          label="Name"
          htmlFor="displayName"
          error={errors.displayName?.message}
        >
          <Input
            id="displayName"
            type="text"
            autoComplete="name"
            invalid={!!errors.displayName}
            {...register("displayName")}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
        </Field>
        {formError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {formError}
          </p>
        )}
        <Button type="submit" loading={isSubmitting} className="mt-1">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
