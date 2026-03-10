"use client";

import { useEffect } from "react";

export function ClientErrorLogger() {
    useEffect(() => {
        const handleError = (e: ErrorEvent) => {
            fetch("/api/ops/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "error",
                    source: "window.onerror",
                    message: e.message || String(e.error),
                    stack: e.error?.stack,
                }),
            }).catch(() => {});
        };

        const handleRejection = (e: PromiseRejectionEvent) => {
            const msg = e.reason?.message || String(e.reason);
            fetch("/api/ops/log", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "error",
                    source: "unhandledrejection",
                    message: msg,
                    stack: e.reason?.stack,
                }),
            }).catch(() => {});
        };

        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);
        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);

    return null;
}
