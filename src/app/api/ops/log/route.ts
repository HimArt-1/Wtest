// وشّى | WASHA — تسجيل الأخطاء لمركز الدعم الفني
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            return NextResponse.json({ ok: false }, { status: 500 });
        }

        const body = await req.json().catch(() => ({}));
        const { type = "error", source, message, stack, metadata, userId } = body;

        if (!message || typeof message !== "string") {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        const validTypes = ["error", "warning", "info", "security"];
        const logType = validTypes.includes(type) ? type : "error";

        const supabase = createClient(url, key, { auth: { persistSession: false } });
        await supabase.from("system_logs").insert({
            type: logType,
            source: typeof source === "string" ? source.slice(0, 200) : null,
            message: message.slice(0, 2000),
            stack: typeof stack === "string" ? stack.slice(0, 5000) : null,
            metadata: typeof metadata === "object" && metadata !== null ? metadata : {},
            user_id: userId || null,
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
