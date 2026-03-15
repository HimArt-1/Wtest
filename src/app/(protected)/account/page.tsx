import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Package, ShoppingBag, Settings, Palette, User, ArrowLeft,
    Sparkles, Brush, Star, ChevronLeft, Heart,
} from "lucide-react";
import { ensureProfile } from "@/lib/ensure-profile";
import { getPublicVisibility } from "@/app/actions/settings";
import { OnboardingBanner } from "@/components/account/OnboardingBanner";
import { PushSubscribeButton } from "@/components/notifications/PushSubscribeButton";
import { AccountDashboardClient } from "@/components/account/AccountDashboardClient";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "حسابي — وشّى",
    description: "إدارة حسابك وطلباتك على منصة وشّى",
};

export default async function AccountPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const [profile, visibility] = await Promise.all([
        ensureProfile(),
        getPublicVisibility(),
    ]);

    const supabase = getSupabaseAdminClient();
    const { count: ordersCount } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("buyer_id", profile?.id || "");

    let applicationStatus: string | null = null;
    if (profile && profile.role === "subscriber") {
        const { data: app } = await supabase
            .from("applications")
            .select("status")
            .eq("email", (user.emailAddresses?.[0]?.emailAddress || "").trim().toLowerCase())
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        applicationStatus = app?.status || null;
    }

    const isArtist = profile?.role === "wushsha";
    const isAdmin = profile?.role === "admin";
    const isSubscriber = profile?.role === "subscriber";

    const roleLabel = isArtist ? "وشّاي" : isAdmin ? "مشرف" : "مشترك";

    return (
        <AccountDashboardClient
            profile={profile}
            currentUser={{
                firstName: user.firstName,
                imageUrl: user.imageUrl,
            }}
            roleLabel={roleLabel}
            isSubscriber={isSubscriber}
            isArtist={isArtist}
            isAdmin={isAdmin}
            visibility={visibility}
            applicationStatus={applicationStatus}
            ordersCount={ordersCount || 0}
        />
    );
}
