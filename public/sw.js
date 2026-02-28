/* وشّى | WUSHA — Service Worker للـ PWA و Web Push */
self.addEventListener("push", (event) => {
    if (!event.data) return;
    const data = event.data.json();
    const title = data.title || "وشّى";
    const options = {
        body: data.body || data.message || "",
        icon: "/favicon-32x32.png",
        badge: "/favicon-16x16.png",
        tag: data.tag || "wusha-notification",
        data: data.url ? { url: data.url } : {},
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url;
    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
});
