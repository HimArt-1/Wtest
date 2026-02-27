"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    Users,
    Palette,
    ShoppingCart,
    DollarSign,
    Package,
    FileText,
    Mail,
    ArrowLeft,
} from "lucide-react";

const ICON_MAP = {
    DollarSign,
    ShoppingCart,
    Palette,
    FileText,
    Users,
    Mail,
    Package,
} as const;

export type StatCardIconId = keyof typeof ICON_MAP;

interface StatCardProps {
    title: string;
    value: string | number;
    icon: StatCardIconId;
    subtitle?: string;
    growth?: number;     // percentage
    delay?: number;
    variant?: "default" | "gold" | "accent" | "forest";
    href?: string;
}

const variantStyles = {
    default: {
        icon: "bg-white/5 text-fg/60",
        glow: "",
    },
    gold: {
        icon: "bg-gold/10 text-gold",
        glow: "hover:shadow-[0_0_40px_rgba(206,174,127,0.12)]",
    },
    accent: {
        icon: "bg-accent/10 text-accent",
        glow: "hover:shadow-[0_0_40px_rgba(157,139,177,0.12)]",
    },
    forest: {
        icon: "bg-forest/10 text-forest",
        glow: "hover:shadow-[0_0_40px_rgba(42,122,90,0.12)]",
    },
};

export function StatCard({
    title,
    value,
    icon: iconId,
    subtitle,
    growth,
    delay = 0,
    variant = "default",
    href,
}: StatCardProps) {
    const styles = variantStyles[variant];
    const Icon = ICON_MAP[iconId] ?? DollarSign;

    const content = (
        <>
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${styles.icon}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                        {growth !== undefined && growth !== 0 && (
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${growth > 0
                                    ? "bg-forest/10 text-forest"
                                    : "bg-red-500/10 text-red-400"
                                }`}>
                                {growth > 0 ? "+" : ""}{growth}%
                            </span>
                        )}
                        {href && (
                            <ArrowLeft className="w-4 h-4 text-fg/20 group-hover:text-gold transition-colors" />
                        )}
                    </div>
                </div>

                <p className="text-fg/40 text-sm font-medium mb-1">{title}</p>
                <p className="text-2xl font-bold text-fg tracking-tight">{value}</p>
                {subtitle && (
                    <p className="text-fg/30 text-xs mt-2">{subtitle}</p>
                )}
            </div>
        </>
    );

    const cardClass = `
        relative overflow-hidden rounded-2xl border border-white/[0.06]
        bg-surface/70 backdrop-blur-sm p-6
        transition-all duration-500 group
        hover:border-white/[0.12] ${styles.glow}
        ${href ? "cursor-pointer" : ""}
    `;

    if (href) {
        return (
            <Link href={href} className="block">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay }}
                    className={cardClass}
                >
                    {content}
                </motion.div>
            </Link>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cardClass}
        >
            {content}
        </motion.div>
    );
}
