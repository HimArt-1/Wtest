"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Activity, AlertTriangle, Wifi, Headphones, Lock, Eye,
    Server, Database, Zap, BarChart3, RefreshCw, ChevronLeft,
    Globe, Clock, FileWarning, CheckCircle2, XCircle, Search,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import {
    getPageVisits,
    getVisitStats,
    getSystemLogs,
    getErrorStats,
    getConnectionStatus,
} from "@/app/actions/ops-center";
import { SupportDashboardPro } from "@/app/(protected)/dashboard/support/SupportDashboardPro";

type TabId = "overview" | "visits" | "errors" | "connection" | "tickets" | "security";

const TABS: { id: TabId; label: string; icon: any }[] = [
    { id: "overview", label: "نظرة عامة", icon: BarChart3 },
    { id: "visits", label: "سجل الزيارات", icon: Eye },
    { id: "errors", label: "داشبورد الأخطاء", icon: AlertTriangle },
    { id: "connection", label: "داشبورد الاتصال", icon: Wifi },
    { id: "tickets", label: "تذاكر الدعم", icon: Headphones },
    { id: "security", label: "الأمان والحماية", icon: Lock },
];

interface SupportOpsCenterProps {
    initialTickets: any[];
}

export function SupportOpsCenter({ initialTickets }: SupportOpsCenterProps) {
    const [activeTab, setActiveTab] = useState<TabId>("overview");
    const [visitStats, setVisitStats] = useState<{ total: number; today: number; uniquePaths: number; topPaths: { path: string; count: number }[] } | null>(null);
    const [visits, setVisits] = useState<any[]>([]);
    const [errorStats, setErrorStats] = useState<{ total: number; today: number; byType: Record<string, number> } | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async (forceRefresh = false) => {
        if (forceRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const [stats, visitList, errStats, logList, conn] = await Promise.all([
                getVisitStats(),
                getPageVisits(80),
                getErrorStats(),
                getSystemLogs(50),
                getConnectionStatus(),
            ]);
            setVisitStats(stats);
            setVisits(visitList);
            setErrorStats(errStats);
            setLogs(logList);
            setConnectionStatus(conn);
        } catch (e) {
            console.error("[SupportOpsCenter]", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            {/* ─── Header مع زر التحديث ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/20 to-amber-600/10 border border-gold/30 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-theme">مركز الدعم الفني</h1>
                        <p className="text-xs text-theme-faint">الصيانة · الفحص · التحليل · الأمان والحماية المطلقة</p>
                    </div>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-subtle border border-theme-soft text-theme-soft hover:bg-theme-soft hover:text-theme transition-all text-sm font-medium disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                    تحديث البيانات
                </button>
            </div>

            {/* ─── شريط التبويبات ─── */}
            <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-theme-faint border border-theme-subtle">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                isActive
                                    ? "bg-gold text-bg shadow-[0_2px_12px_rgba(206,174,127,0.35)]"
                                    : "text-theme-subtle hover:text-theme-soft hover:bg-theme-subtle"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── محتوى التبويبات ─── */}
            <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <OverviewTab
                            visitStats={visitStats}
                            errorStats={errorStats}
                            connectionStatus={connectionStatus}
                            loading={loading}
                        />
                    </motion.div>
                )}

                {activeTab === "visits" && (
                    <motion.div
                        key="visits"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <VisitsTab visits={visits} stats={visitStats} loading={loading} />
                    </motion.div>
                )}

                {activeTab === "errors" && (
                    <motion.div
                        key="errors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ErrorsTab logs={logs} stats={errorStats} loading={loading} />
                    </motion.div>
                )}

                {activeTab === "connection" && (
                    <motion.div
                        key="connection"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <ConnectionTab status={connectionStatus} loading={loading} />
                    </motion.div>
                )}

                {activeTab === "tickets" && (
                    <motion.div
                        key="tickets"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <SupportDashboardPro initialTickets={initialTickets} />
                    </motion.div>
                )}

                {activeTab === "security" && (
                    <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <SecurityTab connectionStatus={connectionStatus} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── تبويب النظرة العامة ───
function OverviewTab({
    visitStats,
    errorStats,
    connectionStatus,
    loading,
}: {
    visitStats: { total: number; today: number; uniquePaths: number; topPaths: { path: string; count: number }[] } | null;
    errorStats: { total: number; today: number; byType: Record<string, number> } | null;
    connectionStatus: any[];
    loading: boolean;
}) {
    const connOk = connectionStatus.filter((c) => c.status === "ok").length;
    const connTotal = connectionStatus.length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "زيارات اليوم", value: visitStats?.today ?? "—", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "إجمالي الزيارات", value: visitStats?.total ?? "—", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                    { label: "أخطاء اليوم", value: errorStats?.today ?? "—", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                    { label: "حالة الاتصال", value: `${connOk}/${connTotal}`, icon: Wifi, color: connOk === connTotal ? "text-emerald-400" : "text-amber-400", bg: connOk === connTotal ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20" },
                ].map((s, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-5 rounded-2xl border ${s.bg}`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-[11px] text-theme-subtle font-medium">{s.label}</span>
                        </div>
                        <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-theme-subtle bg-surface/50 p-5">
                    <h3 className="text-sm font-bold text-theme mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gold" />
                        أكثر الصفحات زيارة
                    </h3>
                    {loading ? (
                        <div className="text-theme-faint text-sm">جاري التحميل...</div>
                    ) : visitStats?.topPaths?.length ? (
                        <ul className="space-y-2">
                            {visitStats.topPaths.slice(0, 8).map((p, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-theme-soft truncate max-w-[200px]" title={p.path}>{p.path || "/"}</span>
                                    <span className="text-gold font-bold">{p.count}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-theme-faint text-sm">لا توجد بيانات بعد</p>
                    )}
                </div>

                <div className="rounded-2xl border border-theme-subtle bg-surface/50 p-5">
                    <h3 className="text-sm font-bold text-theme mb-4 flex items-center gap-2">
                        <Server className="w-4 h-4 text-gold" />
                        حالة الخدمات
                    </h3>
                    {connectionStatus.length ? (
                        <ul className="space-y-2">
                            {connectionStatus.map((c, i) => (
                                <li key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-theme-soft">{c.name}</span>
                                    <span className={`flex items-center gap-1 ${c.status === "ok" ? "text-emerald-400" : c.status === "fail" ? "text-red-400" : "text-amber-400"}`}>
                                        {c.status === "ok" ? <CheckCircle2 className="w-4 h-4" /> : c.status === "fail" ? <XCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                        {c.message}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-theme-faint text-sm">جاري التحميل...</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── تبويب سجل الزيارات ───
function VisitsTab({ visits, stats, loading }: { visits: any[]; stats: any; loading: boolean }) {
    const [search, setSearch] = useState("");

    const filtered = search.trim()
        ? visits.filter((v) => v.path?.toLowerCase().includes(search.toLowerCase()))
        : visits;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-faint" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="بحث بالمسار..."
                        className="w-full pr-10 pl-4 py-2 bg-theme-subtle border border-theme-subtle rounded-lg text-sm text-theme placeholder:text-theme-faint focus:outline-none focus:border-gold/30"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs text-theme-subtle">
                    <span>إجمالي: {stats?.total ?? 0}</span>
                    <span>•</span>
                    <span>اليوم: {stats?.today ?? 0}</span>
                </div>
            </div>

            <div className="rounded-2xl border border-theme-subtle bg-surface/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-theme-faint">جاري التحميل...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-theme-faint">
                        <Eye className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>لا توجد زيارات مسجلة</p>
                    </div>
                ) : (
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-theme-faint">
                        {filtered.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-4 px-5 py-3 hover:bg-theme-faint">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <Globe className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-theme truncate">{v.path || "/"}</p>
                                    <p className="text-[11px] text-theme-faint truncate">{v.user_agent?.slice(0, 60) || "—"}</p>
                                </div>
                                <span className="text-[11px] text-theme-subtle shrink-0">
                                    {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ar })}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── تبويب الأخطاء ───
function ErrorsTab({ logs, stats, loading }: { logs: any[]; stats: any; loading: boolean }) {
    const [filter, setFilter] = useState<string>("all");

    const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-theme-subtle">إجمالي الأخطاء: <strong className="text-red-400">{stats?.total ?? 0}</strong></span>
                    <span className="text-theme-faint">|</span>
                    <span className="text-theme-subtle">اليوم: <strong className="text-amber-400">{stats?.today ?? 0}</strong></span>
                </div>
                <div className="flex gap-1.5">
                    {["all", "error", "warning", "info", "security"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                                filter === f ? "bg-gold text-bg" : "bg-theme-subtle text-theme-subtle hover:bg-theme-soft"
                            }`}
                        >
                            {f === "all" ? "الكل" : f === "error" ? "أخطاء" : f === "warning" ? "تحذيرات" : f === "info" ? "معلومات" : "أمان"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-theme-subtle bg-surface/50 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-theme-faint">جاري التحميل...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-theme-faint">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400 opacity-50" />
                        <p>لا توجد أخطاء مسجلة — النظام يعمل بشكل سليم</p>
                    </div>
                ) : (
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-theme-faint">
                        {filtered.map((log) => (
                            <div key={log.id} className="px-5 py-4 hover:bg-theme-faint">
                                <div className="flex items-start gap-3">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                        log.type === "error" ? "bg-red-500/10" : log.type === "warning" ? "bg-amber-500/10" : "bg-theme-subtle"
                                    }`}>
                                        <FileWarning className={`w-4 h-4 ${
                                            log.type === "error" ? "text-red-400" : log.type === "warning" ? "text-amber-400" : "text-theme-subtle"
                                        }`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-theme">{log.message}</p>
                                        {log.source && <p className="text-[11px] text-theme-faint mt-0.5">{log.source}</p>}
                                        {log.stack && (
                                            <pre className="mt-2 text-[10px] text-theme-faint overflow-x-auto max-h-20">{log.stack.slice(0, 300)}</pre>
                                        )}
                                        <span className="text-[10px] text-theme-faint mt-1 block">
                                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                                        log.type === "error" ? "bg-red-500/20 text-red-400" : log.type === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-theme-subtle text-theme-subtle"
                                    }`}>
                                        {log.type}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── تبويب الاتصال ───
function ConnectionTab({ status, loading }: { status: any[]; loading: boolean }) {
    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-theme-subtle bg-surface/50 p-6">
                <h3 className="text-sm font-bold text-theme mb-4 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-gold" />
                    حالة الاتصال بالخدمات
                </h3>
                {loading ? (
                    <div className="text-theme-faint">جاري الفحص...</div>
                ) : (
                    <div className="space-y-4">
                        {status.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-theme-faint border border-theme-subtle">
                                <div className="flex items-center gap-3">
                                    {s.status === "ok" ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    ) : s.status === "fail" ? (
                                        <XCircle className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <Zap className="w-5 h-5 text-amber-400" />
                                    )}
                                    <span className="font-medium text-theme">{s.name}</span>
                                </div>
                                <div className="text-left">
                                    <p className={`text-sm font-medium ${s.status === "ok" ? "text-emerald-400" : s.status === "fail" ? "text-red-400" : "text-amber-400"}`}>
                                        {s.message}
                                    </p>
                                    {s.latency !== undefined && (
                                        <p className="text-[11px] text-theme-faint">زمن الاستجابة: {s.latency}ms</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── تبويب الأمان ───
function SecurityTab({ connectionStatus }: { connectionStatus: any[] }) {
    const allOk = connectionStatus.every((c) => c.status === "ok" || c.status === "unknown");

    return (
        <div className="space-y-6">
            <div className={`rounded-2xl border p-6 ${allOk ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${allOk ? "bg-emerald-500/20" : "bg-amber-500/20"}`}>
                        <Shield className={`w-7 h-7 ${allOk ? "text-emerald-400" : "text-amber-400"}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-theme">
                            {allOk ? "النظام آمن ومحمي" : "يرجى مراجعة الإعدادات"}
                        </h3>
                        <p className="text-sm text-theme-subtle mt-0.5">
                            {allOk
                                ? "جميع الخدمات تعمل بشكل صحيح. قاعدة البيانات والاتصالات محمية."
                                : "توجد بعض الخدمات التي تحتاج إلى مراجعة."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-theme-subtle bg-surface/50 p-5">
                    <h4 className="text-sm font-bold text-theme mb-3 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gold" />
                        الحماية والأمان
                    </h4>
                    <ul className="space-y-2 text-sm text-theme-soft">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            RLS مفعّل على الجداول الحساسة
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            Clerk للمصادقة والجلسات
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            Service Role محمي ولا يُعرض للعميل
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            سجل الزيارات والأخطاء للمراجعة
                        </li>
                    </ul>
                </div>

                <div className="rounded-2xl border border-theme-subtle bg-surface/50 p-5">
                    <h4 className="text-sm font-bold text-theme mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4 text-gold" />
                        توصيات أمنية
                    </h4>
                    <ul className="space-y-2 text-sm text-theme-soft">
                        <li>• مراجعة سجل الأخطاء بانتظام</li>
                        <li>• تحديث المتغيرات البيئية بشكل آمن</li>
                        <li>• تفعيل النسخ الاحتياطي لقاعدة البيانات</li>
                        <li>• مراقبة الزيارات غير الطبيعية</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
