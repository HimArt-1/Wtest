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
import { getSupabaseServerClient } from "@/lib/supabase";
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

    const supabase = getSupabaseServerClient();
    const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("buyer_id", profile?.id || "");

    let applicationStatus: string | null = null;
    if (profile && profile.role === "subscriber") {
        const { data: app } = await supabase
            .from("applications")
            .select("status")
            .eq("email", user.emailAddresses?.[0]?.emailAddress || "")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        applicationStatus = (app as any)?.status || null;
    }

    const isArtist = profile?.role === "wushsha";
    const isAdmin = profile?.role === "admin";
    const isSubscriber = profile?.role === "subscriber";

    const roleLabel = isArtist ? "وشّاي" : isAdmin ? "مشرف" : "مشترك";

    const links: {
        title: string;
        description: string;
        href: string;
        icon: typeof Package;
        badge?: number;
        color: string;
    }[] = [];

    if (isArtist) {
        links.push({
            title: "الاستوديو",
            description: "إدارة أعمالك الفنية",
            href: "/studio",
            icon: Palette,
            color: "from-pink-500/20 to-pink-600/10",
        });
    }

    links.push(
        {
            title: "صمّم قطعتك",
            description: "صمّم تيشيرت أو هودي بالذكاء الاصطناعي",
            href: "/design",
            icon: Sparkles,
            color: "from-gold/20 to-amber-600/10",
        },
        {
            title: "طلباتي",
            description: "تتبع حالة طلباتك",
            href: "/account/orders",
            icon: Package,
            badge: ordersCount || 0,
            color: "from-blue-500/20 to-blue-600/10",
        },
        {
            title: "المتجر",
            description: "تصفح المنتجات والأعمال",
            href: "/store",
            icon: ShoppingBag,
            color: "from-emerald-500/20 to-emerald-600/10",
        },
        {
            title: "محفوظاتي",
            description: "المنتجات المحفوظة",
            href: "/account/wishlist",
            icon: Heart,
            color: "from-red-500/20 to-red-600/10",
        },
        {
            title: "المعرض",
            description: "اكتشف أعمالاً فنية جديدة",
            href: "/gallery",
            icon: Brush,
            color: "from-purple-500/20 to-purple-600/10",
        },
        {
            title: "الإعدادات",
            description: "تعديل الملف الشخصي",
            href: "/studio/settings",
            icon: Settings,
            color: "from-slate-500/20 to-slate-600/10",
        },
    );

    return (
        <div className="pt-8 pb-16">
            <div className="max-w-4xl mx-auto px-6">
                <OnboardingBanner />

                {/* ─── Profile Header ─── */}
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/[0.08] bg-surface shrink-0">
                        {profile?.avatar_url ? (
                            <Image src={profile.avatar_url} alt="" width={80} height={80} className="object-cover w-full h-full" />
                        ) : user.imageUrl ? (
                            <Image src={user.imageUrl} alt="" width={80} height={80} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full bg-gold/20 flex items-center justify-center text-gold text-2xl font-bold">
                                <User className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-fg">
                            مرحباً، {profile?.display_name || user.firstName || "مستخدم وشّى"}
                        </h1>
                        <p className="text-fg/30 text-sm mt-1">
                            {roleLabel} · @{profile?.username || "user"}
                        </p>
                    </div>
                </div>

                {/* ─── Join as Artist CTA (subscribers only, when enabled) ─── */}
                {isSubscriber && !applicationStatus && visibility.join_artist && (
                    <Link href="/join" className="block mb-8 group">
                        <div className="relative overflow-hidden rounded-2xl border border-gold/20 bg-gradient-to-l from-gold/[0.06] via-gold/[0.03] to-transparent p-6 hover:border-gold/40 transition-all duration-500">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gold/[0.05] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                        <Star className="w-7 h-7 text-gold" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-fg text-base mb-1">
                                            انضم كفنان وشّاي
                                        </h3>
                                        <p className="text-fg/40 text-sm leading-relaxed">
                                            اعرض أعمالك، بِع تصاميمك، وانضم لمجتمع الفنانين
                                        </p>
                                    </div>
                                </div>
                                <ChevronLeft className="w-5 h-5 text-gold/40 group-hover:text-gold group-hover:-translate-x-1 transition-all" />
                            </div>
                        </div>
                    </Link>
                )}

                {/* ─── Application Status (if pending/reviewing) ─── */}
                {isSubscriber && applicationStatus && applicationStatus !== "accepted" && (
                    <div className="mb-8 rounded-2xl border border-white/[0.06] bg-surface/30 p-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                applicationStatus === "pending" || applicationStatus === "reviewing"
                                    ? "bg-amber-500/10 border border-amber-500/20"
                                    : "bg-red-500/10 border border-red-500/20"
                            }`}>
                                <Star className={`w-6 h-6 ${
                                    applicationStatus === "pending" || applicationStatus === "reviewing"
                                        ? "text-amber-400"
                                        : "text-red-400"
                                }`} />
                            </div>
                            <div>
                                <h3 className="font-bold text-fg text-sm">
                                    {applicationStatus === "pending" && "طلب الانضمام قيد المراجعة"}
                                    {applicationStatus === "reviewing" && "طلبك قيد المراجعة من الفريق"}
                                    {applicationStatus === "rejected" && "لم يتم قبول طلبك هذه المرة"}
                                </h3>
                                <p className="text-fg/30 text-xs mt-1">
                                    {applicationStatus === "rejected"
                                        ? "يمكنك إعادة التقديم لاحقاً بعد تطوير معرض أعمالك"
                                        : "سنخبرك فور اتخاذ القرار — شكراً لصبرك"
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Quick Links Grid ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group p-5 rounded-2xl border border-white/[0.06] hover:border-gold/20 transition-all duration-500 bg-surface/30 hover:bg-surface/50 relative overflow-hidden"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.08] transition-colors">
                                        <link.icon className="w-5 h-5 text-fg/40 group-hover:text-gold transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-fg text-sm flex items-center gap-2">
                                            {link.title}
                                            {link.badge !== undefined && link.badge > 0 && (
                                                <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full">{link.badge}</span>
                                            )}
                                        </h3>
                                        <p className="text-xs text-fg/30 mt-0.5">{link.description}</p>
                                    </div>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-fg/10 group-hover:text-gold/40 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
