"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Palette,
    Wand2,
    Settings,
    LogOut,
    ChevronRight,
    Search
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/ui/Logo";

const menuItems = [
    { icon: LayoutDashboard, label: "لوحة التحكم", href: "/studio" },
    { icon: Palette, label: "أعمالي", href: "/studio/artworks" },
    { icon: Wand2, label: "توليد (AI)", href: "/studio/create" },
    { icon: Settings, label: "الإعدادات", href: "/studio/settings" },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.aside
            className="h-screen bg-sand/50 backdrop-blur-xl border-l border-ink/10 sticky top-0 flex flex-col z-50 transition-all duration-300"
            animate={{ width: isCollapsed ? 80 : 280 }}
        >
            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-ink/5">
                {!isCollapsed && <Logo size="sm" />}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-ink/5 rounded-lg transition-colors"
                >
                    <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                </button>
            </div>

            {/* Menu */}
            <div className="flex-1 py-6 px-4 flex flex-col gap-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <SidebarItem
                        key={item.href}
                        {...item}
                        isCollapsed={isCollapsed}
                    />
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-ink/5">
                <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-ink/5 ${isCollapsed ? "justify-center" : ""}`}>
                    <UserButton afterSignOutUrl="/" />
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate">حسابي</span>
                            <span className="text-xs text-ink/50 truncate">إدارة الملف</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
