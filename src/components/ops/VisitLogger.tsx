"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export function VisitLogger() {
    const lastPath = useRef<string | null>(null);
    const pathname = usePathname();
    const { user } = useUser();

    useEffect(() => {
        if (typeof window === "undefined" || !pathname) return;
        if (lastPath.current === pathname) return;
        lastPath.current = pathname;

        let sid = "";
        try {
            sid = sessionStorage.getItem("wusha_sid") || crypto.randomUUID?.()?.slice(0, 8) || "";
            if (!sessionStorage.getItem("wusha_sid")) sessionStorage.setItem("wusha_sid", sid);
        } catch {
            sid = "";
        }

        fetch("/api/ops/visit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                path: pathname,
                fullUrl: window.location.href,
                referrer: document.referrer || null,
                userAgent: navigator.userAgent,
                sessionId: sid,
                clerkId: user?.id || null,
            }),
        }).catch(() => {});
    }, [pathname, user?.id]);

    return null;
}
