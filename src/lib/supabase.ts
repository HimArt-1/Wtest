// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Supabase Client
//  عميل للمتصفح + الخادم
// ═══════════════════════════════════════════════════════════

import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ─── Environment Variables ───────────────────────────────

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ─── Browser Client (Client Components) ─────────────────

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
    if (!browserClient) {
        browserClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
    }
    return browserClient;
}

// ─── Server Client (Server Components / Actions) ────────

export function getSupabaseServerClient() {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

// ─── Admin Client (Server-only, bypasses RLS) ───────────

export function getSupabaseAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }
    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
