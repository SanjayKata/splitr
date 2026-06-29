// Splitr — send-push Edge Function (Deno)
//
// Triggered by a Supabase Database Webhook on INSERT into public.notifications.
// Looks up the recipient's push subscriptions and delivers a Web Push to each.
//
// Required function secrets:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (e.g. mailto:you@x.com),
//   APP_URL (e.g. https://sanjaykata.github.io/splitr)
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Deploy: `supabase functions deploy send-push` (or paste in the dashboard editor).

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

interface NotificationRow {
  user_id: string;
  kind: "expense" | "settlement";
  actor_name: string;
  group_name: string | null;
  title: string | null;
  amount: number | null;
  currency: string | null;
}

function bodyText(n: NotificationRow): string {
  const amount =
    n.amount != null && n.currency
      ? ` (${n.currency} ${Number(n.amount).toFixed(2)})`
      : "";
  if (n.kind === "settlement") {
    return `${n.actor_name} recorded a payment${amount}`;
  }
  const what = n.title ? `"${n.title}"` : "an expense";
  return `${n.actor_name} added ${what}${amount}`;
}

webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:admin@example.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const n = payload.record as NotificationRow | undefined;
    if (!n?.user_id) {
      return new Response("no record", { status: 200 });
    }

    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", n.user_id);
    if (error) throw error;

    const notification = JSON.stringify({
      title: n.group_name ? `Splitr · ${n.group_name}` : "Splitr",
      body: bodyText(n),
      url: `${Deno.env.get("APP_URL") ?? ""}/notifications`,
    });

    await Promise.all(
      (subs ?? []).map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            notification,
          );
        } catch (err: unknown) {
          // 404/410 → subscription is dead; clean it up.
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 404 || status === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", s.endpoint);
          }
        }
      }),
    );

    return new Response(JSON.stringify({ sent: subs?.length ?? 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
