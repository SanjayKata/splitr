import { vapidPublicKey } from "@/lib/env";
import {
  deleteSubscription,
  upsertSubscription,
} from "@/repositories/push.repository";

/** Web Push helpers (browser-only). */

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    vapidPublicKey.length > 0
  );
}

/** VAPID keys are base64url; the PushManager wants a Uint8Array. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/** Ask permission, subscribe, and persist the subscription. */
export async function enablePush(): Promise<void> {
  if (!isPushSupported())
    throw new Error("Push notifications aren't supported here");

  const permission = await Notification.requestPermission();
  if (permission !== "granted")
    throw new Error("Notification permission denied");

  const reg = await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    }));

  const json = sub.toJSON();
  await upsertSubscription({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? "",
    auth: json.keys?.auth ?? "",
  });
}

/** Unsubscribe locally and remove the stored subscription. */
export async function disablePush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  const { endpoint } = sub;
  await sub.unsubscribe();
  await deleteSubscription(endpoint);
}
