// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — useSupabase Hook
//  وصول سريع لعميل Supabase في Client Components
// ═══════════════════════════════════════════════════════════

import { useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Returns a memoized Supabase browser client.
 * Use this in Client Components only.
 *
 * @example
 * const supabase = useSupabase();
 * const { data } = await supabase.from("artworks").select("*");
 */
export function useSupabase() {
    return useMemo(() => getSupabaseBrowserClient(), []);
}
