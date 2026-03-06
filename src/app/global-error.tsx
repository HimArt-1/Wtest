"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the actual error to help debug
        console.error("Global Error:", error);
    }, [error]);

    return (
        <html dir="rtl" lang="ar">
            <body style={{ background: "#080808", color: "#f0ebe3", fontFamily: "system-ui", padding: "2rem", textAlign: "center" }}>
                <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>❌ خطأ في الخادم</h1>
                <div style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: "12px", padding: "1.5rem", maxWidth: "600px", margin: "0 auto", textAlign: "left", direction: "ltr" }}>
                    <p style={{ color: "#ff6b6b", marginBottom: "0.5rem" }}>
                        <strong>Error:</strong> {error.message}
                    </p>
                    <p style={{ color: "#666", fontSize: "0.875rem" }}>
                        <strong>Digest:</strong> {error.digest}
                    </p>
                    <pre style={{ color: "#888", fontSize: "0.7rem", overflow: "auto", maxHeight: "200px", marginTop: "1rem", whiteSpace: "pre-wrap" }}>
                        {error.stack}
                    </pre>
                </div>
                <button
                    onClick={reset}
                    style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", background: "#ceae7f", color: "#080808", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                >
                    إعادة المحاولة
                </button>
            </body>
        </html>
    );
}
