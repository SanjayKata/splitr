/**
 * Turn a Supabase auth error into a short, user-friendly message.
 * Falls back to the raw message for anything unrecognized.
 */
export function authErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Try signing in.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  return message;
}
