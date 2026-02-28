import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return NextResponse.json({ error: "Missing subscription data" }, { status: 400 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("clerk_id", userId)
        .single();

    const profileId = profile?.id || null;

    await supabase.from("push_subscriptions").upsert(
        {
            user_id: profileId,
            endpoint,
            p256dh: keys.p256dh,
            auth: keys.auth,
            user_agent: req.headers.get("user-agent") || null,
        },
        { onConflict: "endpoint" }
    );

    return NextResponse.json({ success: true });
}
