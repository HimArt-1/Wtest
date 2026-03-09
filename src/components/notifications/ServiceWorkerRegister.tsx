"use client";

import { useEffect } from "react";

/** تسجيل Service Worker للـ PWA و Web Push */
export function ServiceWorkerRegister() {
    useEffect(() => {
        // تعطيل Service Worker في وضع التطوير
        if (process.env.NODE_ENV === "development") return;
        
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
        
        navigator.serviceWorker
            .register("/sw.js")
            .then((reg) => {
                console.log("[SW] Registered", reg.scope);
            })
            .catch((e) => {
                // تجاهل الأخطاء في وضع التطوير
                if (process.env.NODE_ENV === "development") return;
                console.warn("[SW] Register failed:", e);
            });
    }, []);
    return null;
}
