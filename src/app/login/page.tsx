"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/components/auth/auth-provider";
import { AuthCard } from "@/components/auth/auth-card";
import { loginSchema, type LoginValues } from "@/lib/validation/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

export default function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  // Already signed in → skip the login screen.
  useEffect(() => {
    if (!loading && user) router.replace("/groups");
  }, [loading, user, router]);

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      router.replace("/groups");
    } catch (err) {
      setFormError(authErrorMessage(err));
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your Splitr account"
      footer={
        <>
          New to Splitr?{" "}
          <Link
            href="/signup"
            className="font-medium text-emerald-600 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
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
            autoComplete="current-password"
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
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
