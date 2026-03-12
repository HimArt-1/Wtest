"use client";

import { motion } from "framer-motion";
import {
    DollarSign, ShoppingCart, Users, Palette, Package, Mail, FileText,
    TrendingUp, TrendingDown, Award, AlertTriangle, ArrowUpLeft,
} from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/StatusBadge";

import RevenueChart from "@/components/admin/analytics/RevenueChart";
import TopProductsList from "@/components/admin/analytics/TopProductsList";
import LowStockWidget from "@/components/admin/analytics/LowStockWidget";

// ─── Types ──────────────────────────────────────────────

interface DashboardProps {
    stats: {
        totalUsers: number; totalArtists: number; totalBuyers: number;
        totalOrders: number; totalRevenue: number; thisMonthRevenue: number;
        revenueGrowth: number; totalArtworks: number; totalProducts: number;
        pendingApplications: number; totalSubscribers: number; averageOrderValue: number;
    };
    recentOrders: any[];
    pendingApplications: any[];
    topProductsList: any[];
    monthlyRevenue: any[];
    lowStockList: any[];
}

// ─── Mini Sparkline (Pure CSS) ──────────────────────────

function MiniChart({ data, color }: { data: number[]; color: string }) {
    if (data.length === 0) return null;
    const max = Math.max(...data, 1);
    return (
        <div className="flex items-end gap-[2px] h-8">
            {data.slice(-7).map((v, i) => (
                <div key={i} className={`w-1.5 rounded-full ${color} transition-all`}
                    style={{ height: `${Math.max(4, (v / max) * 100)}%`, opacity: 0.4 + (v / max) * 0.6 }} />
            ))}
        </div>
    );
}

// ─── Stat Card (Inline) ─────────────────────────────────

function KPICard({ title, value, subtitle, icon: Icon, color, href, growth, delay, chart }:
    {
        title: string; value: string | number; subtitle?: string; icon: any; color: string;
        href?: string; growth?: number; delay: number; chart?: number[]
    }) {
    const growthEl = growth !== undefined && growth !== 0 ? (
        <span className={`text-[10px] font-bold flex items-center gap-0.5 ${growth > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {growth > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
            {Math.abs(growth).toFixed(1)}%
        </span>
    ) : null;

    const content = (
        <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
            className={`p-5 rounded-2xl border backdrop-blur-sm transition-all group ${color} ${href ? "cursor-pointer hover:scale-[1.02]" : ""}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 opacity-60" />
                    <span className="text-[11px] font-medium opacity-50">{title}</span>
                </div>
                {growthEl}
            </div>
            <div className="flex items-end justify-between">
                <div>
                    <p suppressHydrationWarning className="text-2xl font-black">{value}</p>
                    {subtitle && <p suppressHydrationWarning className="text-[10px] opacity-40 mt-0.5">{subtitle}</p>}
                </div>
                {chart && <MiniChart data={chart} color="bg-current" />}
            </div>
        </motion.div>
    );

    return href ? <Link href={href}>{content}</Link> : content;
}

// ─── Main Dashboard ─────────────────────────────────────

export function DashboardClient({ stats, recentOrders, pendingApplications, topProductsList, monthlyRevenue, lowStockList }: DashboardProps) {
    const revenueChartData = monthlyRevenue.map((d) => d.revenue);
    const ordersChartData = monthlyRevenue.map((d) => d.orders);
    const lowStockCount = lowStockList.length;

    return (
        <div className="space-y-6">
            {/* ─── Primary KPIs ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="إجمالي الإيرادات" value={`${stats.totalRevenue.toLocaleString()} ر.س`}
                    subtitle={`هذا الشهر: ${stats.thisMonthRevenue.toLocaleString()} ر.س`}
                    icon={DollarSign} color="bg-gold/[0.06] border-gold/20 text-gold"
                    growth={stats.revenueGrowth} delay={0} chart={revenueChartData} />

                <KPICard title="الطلبات" value={stats.totalOrders}
                    icon={ShoppingCart} color="bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-400"
                    delay={0.05} href="/dashboard/orders" chart={ordersChartData} />

                <KPICard title="الوشّايون" value={stats.totalArtists}
                    subtitle={`من أصل ${stats.totalUsers} مستخدم`}
                    icon={Palette} color="bg-purple-500/[0.06] border-purple-500/20 text-purple-400"
                    delay={0.1} href="/dashboard/users" />

                <KPICard title="طلبات الانضمام" value={stats.pendingApplications}
                    subtitle={stats.pendingApplications > 0 ? "بانتظار المراجعة" : "لا توجد"}
                    icon={FileText} color={stats.pendingApplications > 0
                        ? "bg-amber-500/[0.06] border-amber-500/20 text-amber-400"
                        : "bg-theme-faint border-theme-subtle text-theme-subtle"}
                    delay={0.15} href="/dashboard/applications" />
            </div>

            {/* ─── Secondary KPIs ─── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                    { title: "المستخدمون", value: stats.totalUsers, icon: Users, href: "/dashboard/users" },
                    { title: "أعضاء المنصة", value: stats.totalBuyers, icon: Users, href: "/dashboard/users" },
                    { title: "الأعمال الفنية", value: stats.totalArtworks, icon: Palette, href: "/dashboard/artworks" },
                    { title: "المنتجات", value: stats.totalProducts, icon: Package, href: "/dashboard/products-inventory?tab=products" },
                    { title: "مشتركو النشرة", value: stats.totalSubscribers, icon: Mail, href: "/dashboard/newsletter" },
                    {
                        title: "مخزون منخفض", value: lowStockCount, icon: AlertTriangle, href: "/dashboard/products-inventory?tab=inventory",
                        color: lowStockCount > 0 ? "text-amber-400" : undefined
                    },
                ].map((s, i) => (
                    <Link key={i} href={s.href}>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.03 }}
                            className="p-3.5 rounded-xl border border-theme-subtle bg-theme-faint hover:bg-theme-subtle hover:border-gold/10 transition-all cursor-pointer"
                        >
                            <s.icon className={`w-4 h-4 mb-1 ${s.color || "text-theme-faint"}`} />
                            <p className={`text-lg font-black ${s.color || "text-theme-soft"}`}>{s.value}</p>
                            <p className="text-[10px] text-theme-faint mt-0.5">{s.title}</p>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* ─── Main Analytics Row ─── */}
            <div className="mb-6">
                <RevenueChart data={monthlyRevenue} title="تحليل الإيرادات (شهرياً)" />
            </div>

            {/* ─── 3-Column Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Recent Orders */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="lg:col-span-2 rounded-2xl border border-theme-subtle bg-surface/50 backdrop-blur-sm overflow-hidden flex flex-col h-full">
                    <div className="px-5 py-4 border-b border-theme-faint flex items-center justify-between">
                        <h3 className="text-sm font-bold text-theme-strong flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4 text-gold" /> آخر الطلبات
                        </h3>
                        <Link href="/dashboard/orders" className="text-xs text-gold hover:text-gold-light transition-colors font-medium">
                            عرض الكل ←
                        </Link>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-theme-faint">
                                    <th className="text-right px-5 py-2.5 text-theme-faint font-medium text-[11px]">رقم الطلب</th>
                                    <th className="text-right px-4 py-2.5 text-theme-faint font-medium text-[11px]">العميل</th>
                                    <th className="text-right px-4 py-2.5 text-theme-faint font-medium text-[11px]">المبلغ</th>
                                    <th className="text-right px-4 py-2.5 text-theme-faint font-medium text-[11px]">الحالة</th>
                                    <th className="text-right px-5 py-2.5 text-theme-faint font-medium text-[11px]">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.length > 0 ? recentOrders.map((order: any) => (
                                    <tr key={order.id} className="border-b border-theme-faint hover:bg-theme-faint transition-colors">
                                        <td className="px-5 py-3 font-mono text-xs text-gold">{order.order_number}</td>
                                        <td className="px-4 py-3 text-theme-soft text-xs">{order.buyer?.display_name || "—"}</td>
                                        <td suppressHydrationWarning className="px-4 py-3 font-bold text-theme text-xs">{Number(order.total).toLocaleString()} ر.س</td>
                                        <td className="px-4 py-3"><StatusBadge status={order.status} type="order" /></td>
                                        <td suppressHydrationWarning className="px-5 py-3 text-theme-faint text-[11px]" dir="ltr">
                                            {new Date(order.created_at).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="text-center py-10 text-theme-faint text-sm">لا توجد طلبات بعد</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Right Column: Top Products + Low Stock */}
                <div className="space-y-5 flex flex-col">
                    <div className="h-[400px]">
                        <TopProductsList products={topProductsList} />
                    </div>
                    <div className="h-[400px]">
                        <LowStockWidget items={lowStockList} />
                    </div>
                </div>
            </div>

            {/* ─── Pending Applications */}
            {pendingApplications.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="rounded-2xl border border-theme-subtle bg-surface/50 backdrop-blur-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-theme-faint flex items-center justify-between">
                        <h3 className="text-sm font-bold text-theme-strong flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gold" /> طلبات الانضمام المعلقة
                        </h3>
                        <Link href="/dashboard/applications" className="text-xs text-gold hover:text-gold-light transition-colors font-medium">
                            عرض الكل ←
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4">
                        {pendingApplications.map((app: any) => (
                            <Link key={app.id} href="/dashboard/applications"
                                className="p-4 rounded-xl border border-theme-subtle hover:border-gold/20 bg-theme-faint hover:bg-theme-subtle transition-all">
                                <p className="font-bold text-theme-strong text-sm truncate">{app.full_name}</p>
                                <p suppressHydrationWarning className="text-[10px] text-theme-faint mt-1">{app.art_style} · {new Date(app.created_at).toLocaleDateString("ar-SA")}</p>
                            </Link>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
