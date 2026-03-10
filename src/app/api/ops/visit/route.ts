// وشّى | WASHA — تسجيل الزيارات لمركز الدعم الفني
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

async function hashIp(ip: string): Promise<string> {
    return createHash("sha256").update(ip).digest("hex").slice(0, 32);
}

export async function POST(req: NextRequest) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            return NextResponse.json({ ok: false }, { status: 500 });
        }

        const body = await req.json().catch(() => ({}));
        const { path, fullUrl, referrer, userAgent, sessionId, clerkId } = body;

        if (!path || typeof path !== "string") {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        // تجنب تسجيل مسارات حساسة
        const skipPaths = ["/api/", "/_next/", "/favicon", "/dashboard/ops"];
        if (skipPaths.some((p) => path.startsWith(p))) {
            return NextResponse.json({ ok: true });
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
        const ipHash = ip ? (await hashIp(ip)) : null;

        const supabase = createClient(url, key, { auth: { persistSession: false } });
        let userId: string | null = null;
        if (typeof clerkId === "string" && clerkId) {
            const { data: profile } = await supabase.from("profiles").select("id").eq("clerk_id", clerkId).single();
            userId = profile?.id ?? null;
        }
        await supabase.from("page_visits").insert({
            path: path.slice(0, 500),
            full_url: typeof fullUrl === "string" ? fullUrl.slice(0, 1000) : null,
            referrer: typeof referrer === "string" ? referrer.slice(0, 500) : null,
            user_agent: typeof userAgent === "string" ? userAgent.slice(0, 500) : null,
            ip_hash: ipHash,
            user_id: userId,
            session_id: typeof sessionId === "string" ? sessionId.slice(0, 64) : null,
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
