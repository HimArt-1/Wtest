"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    Bell,
    Command,
    ExternalLink,
    LayoutDashboard,
    Users,
    ShoppingCart,
    FileText,
    Package,
    Palette,
    Settings,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const COMMAND_ITEMS = [
    { href: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/dashboard/users", label: "المستخدمون", icon: Users },
    { href: "/dashboard/orders", label: "الطلبات", icon: ShoppingCart },
    { href: "/dashboard/applications", label: "طلبات الانضمام", icon: FileText },
    { href: "/dashboard/artworks", label: "الأعمال الفنية", icon: Palette },
    { href: "/dashboard/products", label: "المنتجات", icon: Package },
    { href: "/dashboard/exclusive-designs", label: "التصاميم الحصرية", icon: Palette },
    { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
    { href: "/store", label: "المتجر العام", icon: ExternalLink, external: true },
    { href: "/studio", label: "الاستوديو", icon: Sparkles },
];

export function AdminTopBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);

    const filtered = query.trim()
        ? COMMAND_ITEMS.filter((i) =>
            i.label.toLowerCase().includes(query.toLowerCase())
        )
        : COMMAND_ITEMS;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen((o) => !o);
            }
            if (e.key === "Escape") setSearchOpen(false);
        },
        []
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const selectItem = (item: (typeof COMMAND_ITEMS)[0]) => {
        if (item.external) {
            window.open(item.href, "_blank");
        } else {
            router.push(item.href);
        }
        setSearchOpen(false);
        setQuery("");
    };

    return (
        <>
            <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    {/* Search / Command Palette Trigger */}
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-gold/30 hover:bg-white/[0.06] transition-all duration-300 min-w-[200px] sm:min-w-[280px] text-right"
                    >
                        <Search className="w-4 h-4 text-fg/40 shrink-0" />
                        <span className="text-sm text-fg/50 flex-1">بحث سريع...</span>
                        <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 text-[10px] text-fg/40 font-mono">
                            <Command className="w-3 h-3" />K
                        </kbd>
                    </button>

                    {/* Right: Notifications + User */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setNotificationsOpen(!notificationsOpen)}
                            className="relative p-2.5 rounded-xl hover:bg-white/5 text-fg/50 hover:text-fg transition-colors"
                            aria-label="الإشعارات"
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-gold/80" />
                        </button>
                        <div className="[&_.cl-userButtonBox]:flex [&_.cl-userButtonTrigger]:rounded-xl">
                            <UserButton
                                afterSignOutUrl="/"
                                appearance={{
                                    elements: {
                                        avatarBox: "w-10 h-10 border-2 border-gold/20 hover:border-gold/40 transition-colors",
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Command Palette Modal */}
            <AnimatePresence>
                {searchOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSearchOpen(false)}
                            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -20 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] mx-4"
                        >
                            <div className="rounded-2xl border border-white/[0.1] bg-surface/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                                    <Search className="w-5 h-5 text-gold" />
                                    <input
                                        autoFocus
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="ابحث عن صفحة أو إجراء..."
                                        className="flex-1 bg-transparent text-fg text-lg placeholder:text-fg/30 focus:outline-none"
                                        dir="rtl"
                                    />
                                    <kbd className="px-2 py-1 rounded bg-white/5 text-[10px] text-fg/40 font-mono">
                                        ESC
                                    </kbd>
                                </div>
                                <div className="max-h-[320px] overflow-y-auto py-2">
                                    {filtered.map((item, i) => {
                                        const Icon = item.icon;
                                        const isActive = pathname === item.href;
                                        return (
                                            <button
                                                key={item.href}
                                                onClick={() => selectItem(item)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                                                    isActive
                                                        ? "bg-gold/10 text-gold"
                                                        : "hover:bg-white/[0.04] text-fg/80"
                                                }`}
                                            >
                                                <Icon className="w-5 h-5 shrink-0 text-fg/40" />
                                                <span className="flex-1 font-medium">{item.label}</span>
                                                {item.external && (
                                                    <ExternalLink className="w-4 h-4 text-fg/30" />
                                                )}
                                            </button>
                                        );
                                    })}
                                    {filtered.length === 0 && (
                                        <div className="px-4 py-8 text-center text-fg/40 text-sm">
                                            لا توجد نتائج
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Notifications Dropdown (placeholder) */}
            <AnimatePresence>
                {notificationsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setNotificationsOpen(false)}
                            className="fixed inset-0 z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-16 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 z-50 rounded-2xl border border-white/[0.08] bg-surface/95 backdrop-blur-2xl shadow-2xl p-4"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-fg">الإشعارات</h3>
                                <button
                                    onClick={() => setNotificationsOpen(false)}
                                    className="text-fg/40 hover:text-fg text-sm"
                                >
                                    إغلاق
                                </button>
                            </div>
                            <div className="text-center py-12 text-fg/40 text-sm">
                                لا توجد إشعارات جديدة
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
