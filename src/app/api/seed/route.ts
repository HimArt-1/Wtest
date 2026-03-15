import { seedData } from "@/lib/seed-data";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { persistSession: false } });
}

async function isAuthorized(req: NextRequest) {
    const secret = process.env.SEED_SECRET?.trim();
    const authHeader = req.headers.get("authorization");
    const authParam = req.nextUrl.searchParams.get("secret");
    const providedSecret = authHeader?.replace(/^Bearer\s+/i, "").trim() || authParam?.trim();

    if (secret && providedSecret === secret) {
        return true;
    }

    const { userId } = await auth();
    if (!userId) {
        return process.env.NODE_ENV !== "production";
    }

    const supabase = getAdminSupabase();
    if (!supabase) return false;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("clerk_id", userId)
        .single();

    return profile?.role === "admin";
}

/** مسار Seed — لا يعمل إلا بمفتاح سري أو صلاحية admin. */
export async function POST(req: NextRequest) {
    if (!(await isAuthorized(req))) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    try {
        await seedData();
        return NextResponse.json({ success: true, message: "Database seeded successfully!" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ success: false, error: "Seeding failed" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
