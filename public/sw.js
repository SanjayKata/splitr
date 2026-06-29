// Splitr service worker — enables installability + a basic offline app shell.
const CACHE = "splitr-shell-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Web Push: show the OS notification.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Splitr";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: new URL("./icons/icon-192.png", self.location.href).href,
      badge: new URL("./icons/icon-192.png", self.location.href).href,
      data: { url: data.url || "./" },
    }),
  );
});

// Focus an open tab (or open one) at the notification's URL when tapped.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "./";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(target);
      }),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Never cache Supabase API/auth calls.
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to cached page when offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req)),
    );
    return;
  }

  // Hashed static assets: cache-first.
  if (
    url.pathname.includes("/_next/") ||
    /\.(?:png|svg|ico|webmanifest|woff2?|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
  }
});
