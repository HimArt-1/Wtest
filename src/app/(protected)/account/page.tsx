import { currentUser } from "@clerk/nextjs/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Package, ShoppingBag, Settings, Palette, User, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "حسابي — وشّى",
    description: "إدارة حسابك وطلباتك على منصة وشّى",
};

export default async function AccountPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const supabase = getSupabaseServerClient();

    // Get profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("clerk_id", user.id)
        .single();

    const profileData = profile as any;

    // Get orders count
    const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_email", user.emailAddresses?.[0]?.emailAddress || "");

    // Quick links
    const links = [
        {
            title: "طلباتي",
            description: "تتبع حالة طلباتك",
            href: "/account/orders",
            icon: Package,
            badge: ordersCount || 0,
            color: "from-blue-500/20 to-blue-600/10",
        },
        {
            title: "الإعدادات",
            description: "تعديل الملف الشخصي",
            href: "/studio/settings",
            icon: Settings,
            color: "from-purple-500/20 to-purple-600/10",
        },
        {
            title: "المتجر",
            description: "تصفح المنتجات",
            href: "/store",
            icon: ShoppingBag,
            color: "from-emerald-500/20 to-emerald-600/10",
        },
        {
            title: "المعرض",
            description: "اكتشف أعمالاً فنية جديدة",
            href: "/gallery",
            icon: Palette,
            color: "from-gold/20 to-amber-600/10",
        },
    ];

    // If user is an artist, add studio link
    if (profileData?.role === "artist") {
        links.splice(1, 0, {
            title: "الاستوديو",
            description: "إدارة أعمالك الفنية",
            href: "/studio",
            icon: Palette,
            color: "from-pink-500/20 to-pink-600/10",
        });
    }

    return (
        <div className="min-h-screen bg-bg pt-24 pb-20" dir="rtl">
            <div className="max-w-4xl mx-auto px-6">
                {/* ─── Profile Header ─── */}
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/[0.08] bg-surface shrink-0">
                        {profileData?.avatar_url ? (
                            <Image src={profileData.avatar_url} alt="" width={80} height={80} className="object-cover w-full h-full" />
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
                            مرحباً، {profileData?.display_name || user.firstName || "مستخدم وشّى"} 👋
                        </h1>
                        <p className="text-fg/30 text-sm mt-1">
                            {profileData?.role === "artist" ? "فنان" : profileData?.role === "admin" ? "مشرف" : "مشتري"} · @{profileData?.username || "wusha-user"}
                        </p>
                    </div>
                </div>

                {/* ─── Quick Links Grid ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="group p-5 rounded-2xl border border-white/[0.06] hover:border-gold/20 transition-all duration-500 bg-surface/30 hover:bg-surface/50 relative overflow-hidden"
                        >
                            {/* Gradient Background */}
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
