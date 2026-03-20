"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import Link from "next/link";
import { getAnnouncementDismissLabel, type Announcement } from "@/lib/announcement-types";

// ─── Storage helpers ────────────────────────────────────

const STORAGE_KEY = "wusha_dismissed_announcements";
const ANNOUNCEMENT_VIEW_PREFIX = "wusha_ann_view";

function getDismissed(): Record<string, string> {
    if (typeof window === "undefined") return {};
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch { return {}; }
}

function setDismissed(id: string, frequency: string) {
    const dismissed = getDismissed();
    dismissed[id] = frequency === "once" ? "permanent" : new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
}

function isDismissed(id: string, frequency: string): boolean {
    const dismissed = getDismissed();
    const val = dismissed[id];
    if (!val) return false;
    if (frequency === "once") return true; // permanent
    if (frequency === "session") {
        // Check if dismissed within session (tab is still open — we use sessionStorage instead)
        try {
            return sessionStorage.getItem(`wusha_ann_${id}`) === "1";
        } catch { return false; }
    }
    return false; // "always" → never dismissed
}

function dismissSession(id: string) {
    try { sessionStorage.setItem(`wusha_ann_${id}`, "1"); } catch {/* noop */ }
}

function matchesAnnouncementPath(pathname: string, targetPages?: string[]) {
    if (!targetPages?.length) return false;
    return targetPages.some((targetPage) => {
        if (targetPage === "/") return pathname === "/";
        return pathname === targetPage || pathname.startsWith(`${targetPage}/`);
    });
}

function canRenderOnCurrentPath(announcement: Announcement, pathname: string) {
    if (announcement.trigger?.type !== "page_enter") return true;
    return matchesAnnouncementPath(pathname, announcement.trigger.targetPages);
}

function buildViewSessionKey(announcementId: string, pathname: string) {
    return `${ANNOUNCEMENT_VIEW_PREFIX}:${announcementId}:${pathname}`;
}

function wasViewTrackedForPath(announcementId: string, pathname: string) {
    try {
        return sessionStorage.getItem(buildViewSessionKey(announcementId, pathname)) === "1";
    } catch {
        return false;
    }
}

function markViewTrackedForPath(announcementId: string, pathname: string) {
    try {
        sessionStorage.setItem(buildViewSessionKey(announcementId, pathname), "1");
    } catch {
        /* noop */
    }
}

function trackAnnouncementEvent(
    eventType: "view" | "click" | "dismiss",
    announcement: Announcement,
    pathname: string,
    metadata: Record<string, unknown> = {}
) {
    if (typeof window === "undefined") return;

    fetch("/api/ops/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
            type: "info",
            source: `announcement.${eventType}`,
            message:
                eventType === "view"
                    ? `Announcement viewed: ${announcement.title}`
                    : eventType === "click"
                        ? `Announcement clicked: ${announcement.title}`
                        : `Announcement dismissed: ${announcement.title}`,
            metadata: {
                announcement_id: announcement.id,
                announcement_title: announcement.title,
                announcement_type: announcement.type,
                trigger_type: announcement.trigger?.type ?? null,
                pathname,
                priority: announcement.priority,
                template: announcement.template,
                layout_mode: announcement.layoutMode ?? "classic",
                link: announcement.link ?? null,
                ...metadata,
            },
        }),
    }).catch(() => {});
}

function resolveLayoutMode(announcement: Announcement): NonNullable<Announcement["layoutMode"]> {
    return announcement.layoutMode || "classic";
}

// ─── Template styles ────────────────────────────────────

const templateStyles: Record<string, string> = {
    gold: "bg-gradient-to-r from-[#5A3E2B] via-[#ceae7f] to-[#5A3E2B] text-theme",
    gradient: "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-theme",
    minimal: "bg-surface border border-theme-soft text-theme-strong",
    alert: "bg-red-500/10 border border-red-500/30 text-red-950 dark:text-red-100",
    promo: "bg-gradient-to-r from-emerald-700 to-teal-600 text-theme",
    neon: "bg-blue-500/[0.08] border border-blue-400/20 text-blue-950 dark:text-blue-100 backdrop-blur-md shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    sunset: "bg-gradient-to-r from-amber-500/20 via-orange-500/16 to-rose-500/16 border border-amber-500/20 text-amber-950 dark:text-amber-50 backdrop-blur-sm",
    frost: "bg-theme-soft border border-white/[0.15] text-theme-strong backdrop-blur-xl shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]",
    rose: "bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-fuchsia-500/10 border border-pink-400/15 text-rose-950 dark:text-pink-100 backdrop-blur-sm",
    aurora: "bg-gradient-to-r from-violet-500/14 via-cyan-500/14 to-emerald-500/14 border border-violet-400/15 text-cyan-950 dark:text-cyan-50 backdrop-blur-md",
    spotlight: "bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.2),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(247,241,230,0.98))] border border-[#ceae7f]/30 text-[#3b2c1d] shadow-[0_22px_50px_rgba(206,174,127,0.18)] dark:bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_32%),linear-gradient(135deg,rgba(29,24,19,0.96),rgba(55,43,31,0.96))] dark:text-[#f7efe3]",
    cinema: "bg-[linear-gradient(135deg,rgba(15,15,20,0.97),rgba(36,24,14,0.94))] border border-amber-400/20 text-amber-50 shadow-[0_25px_60px_rgba(0,0,0,0.4)]",
    editorial: "bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(233,239,246,0.98))] border border-slate-300/70 text-slate-900 shadow-[0_18px_40px_rgba(148,163,184,0.15)] dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.94),rgba(30,41,59,0.94))] dark:border-slate-700 dark:text-slate-100",
    atelier: "bg-[linear-gradient(135deg,rgba(250,246,238,0.98),rgba(229,220,205,0.98))] border border-stone-300/70 text-[#2f2418] shadow-[0_18px_40px_rgba(120,98,72,0.16)] dark:bg-[linear-gradient(135deg,rgba(42,31,24,0.96),rgba(74,56,42,0.96))] dark:border-stone-600 dark:text-[#f7efe5]",
    monogram: "bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.18),transparent_32%),linear-gradient(135deg,rgba(13,22,18,0.98),rgba(34,54,44,0.95))] border border-[#ceae7f]/25 text-[#f5ecd9] shadow-[0_22px_55px_rgba(13,22,18,0.42)]",
    obsidian: "bg-[linear-gradient(135deg,rgba(7,10,19,0.98),rgba(17,29,53,0.95))] border border-cyan-400/20 text-cyan-50 shadow-[0_22px_55px_rgba(7,10,19,0.42)]",
    pearl: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(252,244,255,0.98)),linear-gradient(135deg,rgba(255,255,255,0.96),rgba(245,236,255,0.94))] border border-fuchsia-200/60 text-[#563b63] shadow-[0_18px_40px_rgba(214,180,223,0.22)] dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),rgba(105,72,120,0.18)),linear-gradient(135deg,rgba(55,34,66,0.96),rgba(88,60,102,0.94))] dark:border-fuchsia-400/20 dark:text-[#faebff]",
    kinetic: "bg-[linear-gradient(120deg,rgba(255,96,96,0.22),rgba(255,190,73,0.22),rgba(99,102,241,0.22))] border border-orange-300/30 text-[#3b1f1f] shadow-[0_18px_40px_rgba(249,115,22,0.12)] dark:bg-[linear-gradient(120deg,rgba(255,96,96,0.16),rgba(255,190,73,0.18),rgba(99,102,241,0.2))] dark:border-orange-400/20 dark:text-[#fff1e7]",
};

const templateChipStyles: Record<string, string> = {
    default: "border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/10",
    cinema: "border-amber-300/20 bg-amber-400/10 text-amber-50",
    editorial: "border-slate-300/70 bg-white/80 text-slate-900 dark:border-slate-600 dark:bg-slate-800/65 dark:text-slate-100",
    atelier: "border-stone-300/60 bg-white/65 text-[#2f2418] dark:border-stone-500 dark:bg-stone-900/35 dark:text-[#f7efe5]",
    monogram: "border-[#ceae7f]/25 bg-[#ceae7f]/10 text-[#f5ecd9]",
    obsidian: "border-cyan-300/20 bg-cyan-400/10 text-cyan-50",
    pearl: "border-fuchsia-200/70 bg-white/80 text-[#563b63] dark:border-fuchsia-300/20 dark:bg-fuchsia-200/10 dark:text-[#faebff]",
    kinetic: "border-orange-300/30 bg-orange-200/20 text-[#3b1f1f] dark:border-orange-300/20 dark:bg-orange-300/10 dark:text-[#fff1e7]",
};

const templateActionStyles: Record<string, string> = {
    default: "bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15",
    cinema: "border border-amber-300/20 bg-amber-400/12 text-amber-50 hover:bg-amber-400/18",
    editorial: "border border-slate-300/70 bg-white/80 text-slate-900 hover:bg-white dark:border-slate-600 dark:bg-slate-800/65 dark:text-slate-100 dark:hover:bg-slate-700/75",
    atelier: "border border-stone-300/60 bg-white/70 text-[#2f2418] hover:bg-white dark:border-stone-500 dark:bg-stone-900/35 dark:text-[#f7efe5] dark:hover:bg-stone-900/55",
    monogram: "border border-[#ceae7f]/25 bg-[#ceae7f]/12 text-[#f5ecd9] hover:bg-[#ceae7f]/18",
    obsidian: "border border-cyan-300/20 bg-cyan-400/10 text-cyan-50 hover:bg-cyan-400/18",
    pearl: "border border-fuchsia-200/70 bg-white/85 text-[#563b63] hover:bg-white dark:border-fuchsia-300/20 dark:bg-fuchsia-200/10 dark:text-[#faebff] dark:hover:bg-fuchsia-200/15",
    kinetic: "border border-orange-300/30 bg-orange-200/20 text-[#3b1f1f] hover:bg-orange-200/30 dark:border-orange-300/20 dark:bg-orange-300/10 dark:text-[#fff1e7] dark:hover:bg-orange-300/15",
};

function getTemplateChipClass(template: Announcement["template"]) {
    return templateChipStyles[template] || templateChipStyles.default;
}

function getTemplateActionClass(template: Announcement["template"]) {
    return templateActionStyles[template] || templateActionStyles.default;
}

const templateSignalLabels: Record<Announcement["template"], string> = {
    gold: "Private Offer",
    gradient: "Live Momentum",
    minimal: "Clean Note",
    alert: "Action Required",
    promo: "Store Campaign",
    neon: "Digital Pulse",
    sunset: "Warm Drop",
    frost: "Glass Signal",
    rose: "Community Story",
    aurora: "Atmosphere",
    spotlight: "Featured Drop",
    cinema: "Trailer Drop",
    editorial: "Editor's Note",
    atelier: "Atelier Session",
    monogram: "Maison Signal",
    obsidian: "Night Edition",
    pearl: "Soft Reveal",
    kinetic: "Flash Motion",
};

const templateGlowStyles: Record<Announcement["template"], string> = {
    gold: "bg-[radial-gradient(circle,rgba(206,174,127,0.35),transparent_68%)]",
    gradient: "bg-[radial-gradient(circle,rgba(244,114,182,0.26),transparent_68%)]",
    minimal: "bg-[radial-gradient(circle,rgba(148,163,184,0.16),transparent_70%)]",
    alert: "bg-[radial-gradient(circle,rgba(239,68,68,0.24),transparent_68%)]",
    promo: "bg-[radial-gradient(circle,rgba(16,185,129,0.24),transparent_68%)]",
    neon: "bg-[radial-gradient(circle,rgba(59,130,246,0.28),transparent_70%)]",
    sunset: "bg-[radial-gradient(circle,rgba(249,115,22,0.24),transparent_68%)]",
    frost: "bg-[radial-gradient(circle,rgba(255,255,255,0.16),transparent_72%)]",
    rose: "bg-[radial-gradient(circle,rgba(244,114,182,0.22),transparent_68%)]",
    aurora: "bg-[radial-gradient(circle,rgba(45,212,191,0.22),transparent_70%)]",
    spotlight: "bg-[radial-gradient(circle,rgba(212,175,55,0.28),transparent_66%)]",
    cinema: "bg-[radial-gradient(circle,rgba(251,191,36,0.20),transparent_68%)]",
    editorial: "bg-[radial-gradient(circle,rgba(148,163,184,0.16),transparent_72%)]",
    atelier: "bg-[radial-gradient(circle,rgba(168,139,105,0.18),transparent_70%)]",
    monogram: "bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_66%)]",
    obsidian: "bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_68%)]",
    pearl: "bg-[radial-gradient(circle,rgba(244,208,255,0.24),transparent_70%)]",
    kinetic: "bg-[radial-gradient(circle,rgba(251,146,60,0.24),transparent_68%)]",
};

function getContainerMotion(kind: "banner" | "popup" | "toast" | "marquee", template: Announcement["template"]) {
    if (kind === "popup") {
        return {
            initial: { opacity: 0, scale: template === "cinema" || template === "obsidian" ? 0.94 : 0.97, y: 18 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.98, y: 10 },
            transition: { duration: template === "kinetic" ? 0.26 : 0.34, ease: "easeOut" as const },
        };
    }

    if (kind === "toast") {
        return {
            initial: { opacity: 0, x: -24, y: 14 },
            animate: { opacity: 1, x: 0, y: 0 },
            exit: { opacity: 0, x: -18, y: 10 },
            transition: { duration: 0.28, ease: "easeOut" as const },
        };
    }

    if (kind === "marquee") {
        return {
            initial: { opacity: 0, y: -8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -6 },
            transition: { duration: 0.26, ease: "easeOut" as const },
        };
    }

    return {
        initial: { opacity: 0, y: template === "kinetic" ? -18 : -10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: template === "kinetic" ? 0.24 : 0.3, ease: "easeOut" as const },
    };
}

function AnnouncementAtmosphere({ template }: { template: Announcement["template"] }) {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            <motion.div
                className={`absolute -right-12 top-[-18%] h-44 w-44 rounded-full blur-3xl ${templateGlowStyles[template]}`}
                animate={{ x: [0, -8, 0], y: [0, 10, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className={`absolute -left-10 bottom-[-22%] h-36 w-36 rounded-full blur-3xl opacity-70 ${templateGlowStyles[template]}`}
                animate={{ x: [0, 10, 0], y: [0, -8, 0], scale: [1, 0.92, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
    );
}

function TemplateSignal({ template }: { template: Announcement["template"] }) {
    return (
        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${getTemplateChipClass(template)}`}>
            {templateSignalLabels[template]}
        </span>
    );
}

function AnnouncementMedia({
    ann,
    variant,
    layoutMode = "classic",
}: {
    ann: Announcement;
    variant: "banner" | "popup" | "toast" | "marquee";
    layoutMode?: NonNullable<Announcement["layoutMode"]>;
}) {
    if (!ann.mediaUrl) return null;

    const classNameByVariant = {
        popup:
            layoutMode === "compact"
                ? "h-20 w-20 rounded-2xl object-cover"
                : layoutMode === "split"
                    ? "aspect-[4/5] h-full min-h-[260px] w-full rounded-[24px] object-cover"
                    : "aspect-[16/9] w-full rounded-[24px] object-cover",
        banner:
            layoutMode === "hero"
                ? "aspect-[16/9] w-full rounded-[24px] object-cover"
                : layoutMode === "split"
                    ? "aspect-[4/3] h-full min-h-[180px] w-full rounded-[24px] object-cover"
                    : layoutMode === "compact"
                        ? "h-12 w-12 rounded-2xl object-cover"
                        : "h-14 w-14 rounded-2xl object-cover hidden sm:block",
        toast: "h-14 w-14 rounded-2xl object-cover",
        marquee: "h-10 w-10 rounded-xl object-cover inline-block align-middle mr-3",
    } as const;

    const wrapperByVariant = {
        popup: "overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
        banner: layoutMode === "classic" || layoutMode === "compact"
            ? "shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5"
            : "overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
        toast: "shrink-0 overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
        marquee: "overflow-hidden border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5",
    } as const;

    if (ann.mediaType === "video") {
        if (variant === "marquee") {
            return (
                <span className="mr-3 inline-flex items-center rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-bold dark:border-white/10 dark:bg-white/10">
                    فيديو
                </span>
            );
        }

        return (
            <div className={`${wrapperByVariant[variant]} ${variant === "popup" ? "rounded-2xl" : "rounded-2xl"}`}>
                <video
                    src={ann.mediaUrl}
                    className={classNameByVariant[variant]}
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls={variant === "popup"}
                    poster={ann.mediaPosterUrl}
                />
            </div>
        );
    }

    return (
        <div className={`${wrapperByVariant[variant]} ${variant === "popup" ? "rounded-2xl" : "rounded-2xl"}`}>
            <img src={ann.mediaUrl} alt={ann.mediaAlt || ann.title} className={classNameByVariant[variant]} />
        </div>
    );
}

// ─── Banner Component ───────────────────────────────────

function BannerAnnouncement({
    ann,
    onDismiss,
    onLinkClick,
}: {
    ann: Announcement;
    onDismiss: (trackDismiss?: boolean, dismissReason?: string) => void;
    onLinkClick: () => void;
}) {
    const layoutMode = resolveLayoutMode(ann);
    const layoutMedia = ann.mediaUrl ? (
        <AnnouncementMedia ann={ann} variant="banner" layoutMode={layoutMode} />
    ) : (
        <div className="flex min-h-[180px] items-center justify-center rounded-[24px] border border-black/10 bg-black/5 text-sm font-semibold opacity-75 dark:border-white/10 dark:bg-white/5">
            مساحة بصرية للحملة
        </div>
    );

    if (layoutMode === "hero" || layoutMode === "split") {
        const motionProps = getContainerMotion("banner", ann.template);
        return (
            <motion.div {...motionProps} className={`relative overflow-hidden ${templateStyles[ann.template] || templateStyles.gold}`}>
                <AnnouncementAtmosphere template={ann.template} />
                <div className={`mx-auto max-w-6xl px-6 ${layoutMode === "hero" ? "py-5" : "py-4"}`}>
                    <div className={`relative grid gap-4 ${layoutMode === "hero" ? "lg:grid-cols-[1.05fr,0.95fr] lg:items-center" : "lg:grid-cols-[0.9fr,1.1fr] lg:items-center"}`}>
                        <div className={layoutMode === "hero" ? "space-y-3 text-center lg:text-right" : "space-y-3 text-center lg:text-right"}>
                            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                                <TemplateSignal template={ann.template} />
                                <span className={`rounded-full border px-3 py-1 text-[10px] font-bold ${getTemplateChipClass(ann.template)}`}>
                                    {layoutMode === "hero" ? "Hero" : "Split"}
                                </span>
                                {ann.link && ann.linkText && (
                                    <Link
                                        href={ann.link}
                                        onClick={onLinkClick}
                                        className={`rounded-full px-3 py-1 text-[10px] font-bold transition-colors ${getTemplateActionClass(ann.template)}`}
                                    >
                                        {ann.linkText}
                                    </Link>
                                )}
                            </div>
                            <div>
                                <p className={`${layoutMode === "hero" ? "text-2xl lg:text-3xl" : "text-xl lg:text-2xl"} font-black`}>{ann.title}</p>
                                <p className={`${layoutMode === "hero" ? "mt-3 max-w-2xl text-sm leading-7" : "mt-2 max-w-xl text-sm leading-7"} opacity-85 lg:mr-0 lg:ml-auto`}>
                                    {ann.body}
                                </p>
                            </div>
                        </div>
                        {layoutMedia}
                    </div>
                </div>
                {ann.trigger?.dismissible && (
                    <button onClick={() => onDismiss(true, "banner_close")} className="absolute left-3 top-3 rounded-full bg-black/5 p-1.5 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </motion.div>
        );
    }

    const motionProps = getContainerMotion("banner", ann.template);
    return (
        <motion.div {...motionProps} className={`relative overflow-hidden ${templateStyles[ann.template] || templateStyles.gold}`}>
            <AnnouncementAtmosphere template={ann.template} />
            <div className="relative flex items-center justify-center gap-3 px-6 py-2.5 text-center sm:text-right">
                <AnnouncementMedia ann={ann} variant="banner" layoutMode={layoutMode} />
                <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <TemplateSignal template={ann.template} />
                    </div>
                    <p className="text-sm font-bold">{ann.title}</p>
                    <span className="text-xs opacity-80">{ann.body}</span>
                </div>
                {ann.link && ann.linkText && (
                    <Link href={ann.link} onClick={onLinkClick} className="text-xs font-bold underline underline-offset-2 hover:opacity-80">
                        {ann.linkText}
                    </Link>
                )}
                {ann.trigger?.dismissible && (
                    <button onClick={() => onDismiss(true, "banner_close")} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/5 p-1 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Popup Component ────────────────────────────────────

function PopupAnnouncement({
    ann,
    onDismiss,
    onLinkClick,
}: {
    ann: Announcement;
    onDismiss: (trackDismiss?: boolean, dismissReason?: string) => void;
    onLinkClick: () => void;
}) {
    const layoutMode = resolveLayoutMode(ann);
    const dismissLabel = getAnnouncementDismissLabel(ann);
    const splitMedia = ann.mediaUrl ? (
        <AnnouncementMedia ann={ann} variant="popup" layoutMode={layoutMode} />
    ) : (
        <div className="flex min-h-[260px] items-center justify-center rounded-[24px] border border-black/10 bg-black/5 text-sm font-semibold opacity-75 dark:border-white/10 dark:bg-white/5">
            مساحة وسائط للحملة
        </div>
    );

    if (layoutMode === "split") {
        const motionProps = getContainerMotion("popup", ann.template);
        return (
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                onClick={ann.trigger?.dismissible ? () => onDismiss(true, "popup_overlay") : undefined}
            >
                <motion.div
                    {...motionProps}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative w-full max-w-5xl overflow-hidden rounded-[28px] p-4 md:p-5 shadow-2xl ${templateStyles[ann.template] || templateStyles.gold}`}
                >
                    <AnnouncementAtmosphere template={ann.template} />
                    {ann.trigger?.dismissible && (
                        <button onClick={() => onDismiss(true, "popup_close")} className="absolute left-3 top-3 z-10 rounded-full bg-black/5 p-1.5 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <div className="relative grid gap-4 md:grid-cols-[0.9fr,1.1fr] md:items-center">
                        {splitMedia}
                        <div className="space-y-4 text-center md:text-right">
                            <TemplateSignal template={ann.template} />
                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold ${getTemplateChipClass(ann.template)}`}>
                                Split Layout
                            </span>
                            <div>
                                <h3 className="text-2xl font-black md:text-3xl">{ann.title}</h3>
                                <p className="mt-3 text-sm leading-7 opacity-85">{ann.body}</p>
                            </div>
                            {ann.link && ann.linkText ? (
                                <Link
                                    href={ann.link}
                                    onClick={() => { onLinkClick(); onDismiss(false); }}
                                    className={`inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${getTemplateActionClass(ann.template)}`}
                                >
                                    {ann.linkText}
                                </Link>
                            ) : ann.trigger?.dismissible ? (
                                <button
                                    onClick={() => onDismiss(true, "popup_ack")}
                                    className={`inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${getTemplateActionClass(ann.template)}`}
                                >
                                    {dismissLabel}
                                </button>
                            ) : null}
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    const motionProps = getContainerMotion("popup", ann.template);
    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={ann.trigger?.dismissible ? () => onDismiss(true, "popup_overlay") : undefined}
        >
            <motion.div
                {...motionProps}
                onClick={(e) => e.stopPropagation()}
                className={`relative w-full overflow-hidden ${layoutMode === "hero" ? "max-w-2xl p-7" : layoutMode === "compact" ? "max-w-sm p-5" : "max-w-md p-6"} rounded-2xl text-center shadow-2xl ${templateStyles[ann.template] || templateStyles.gold}`}
            >
                <AnnouncementAtmosphere template={ann.template} />
                {ann.trigger?.dismissible && (
                    <button onClick={() => onDismiss(true, "popup_close")} className="absolute left-3 top-3 rounded-full bg-black/5 p-1.5 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <X className="w-4 h-4" />
                    </button>
                )}
                {layoutMode === "compact" ? (
                    <div className="relative flex items-center gap-3 text-right">
                        <AnnouncementMedia ann={ann} variant="popup" layoutMode={layoutMode} />
                        <div className="min-w-0 flex-1">
                            <div className="mb-2">
                                <TemplateSignal template={ann.template} />
                            </div>
                            <h3 className="text-lg font-black">{ann.title}</h3>
                            <p className="mt-1 text-sm leading-6 opacity-80">{ann.body}</p>
                        </div>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="mb-3">
                            <TemplateSignal template={ann.template} />
                        </div>
                        <AnnouncementMedia ann={ann} variant="popup" layoutMode={layoutMode} />
                        <h3 className={`${layoutMode === "hero" ? "text-2xl md:text-3xl" : "text-xl"} mb-2 font-black`}>{ann.title}</h3>
                        <p className={`${layoutMode === "hero" ? "mx-auto max-w-xl text-sm leading-7" : "text-sm leading-relaxed"} opacity-80`}>{ann.body}</p>
                    </div>
                )}
                {ann.link && ann.linkText && (
                    <Link href={ann.link} onClick={() => { onLinkClick(); onDismiss(false); }}
                        className={`mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${getTemplateActionClass(ann.template)}`}>
                        {ann.linkText}
                    </Link>
                )}
                {ann.trigger?.dismissible && !ann.link && (
                    <button onClick={() => onDismiss(true, "popup_ack")}
                        className={`mt-4 inline-block rounded-xl px-6 py-2.5 text-sm font-bold transition-colors ${getTemplateActionClass(ann.template)}`}>
                        {dismissLabel}
                    </button>
                )}
            </motion.div>
        </div>
    );
}

// ─── Toast Component ────────────────────────────────────

function ToastAnnouncement({
    ann,
    onDismiss,
    onLinkClick,
}: {
    ann: Announcement;
    onDismiss: (trackDismiss?: boolean, dismissReason?: string) => void;
    onLinkClick: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(() => onDismiss(false), 8000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <motion.div
            {...getContainerMotion("toast", ann.template)}
            className={`fixed bottom-6 left-6 z-[9999] max-w-sm rounded-xl p-4 shadow-2xl ${templateStyles[ann.template] || templateStyles.gold}`}
        >
            <div className="mb-2">
                <TemplateSignal template={ann.template} />
            </div>
            <div className="flex items-start gap-3">
                <AnnouncementMedia ann={ann} variant="toast" />
                <div className="flex-1">
                    <p className="font-bold text-sm">{ann.title}</p>
                    <p className="text-xs opacity-80 mt-0.5">{ann.body}</p>
                    {ann.link && ann.linkText && (
                        <Link href={ann.link} onClick={() => { onLinkClick(); onDismiss(false); }} className="text-xs font-bold underline mt-1 inline-block">
                            {ann.linkText}
                        </Link>
                    )}
                </div>
                {ann.trigger?.dismissible && (
                    <button onClick={() => onDismiss(true, "toast_close")} className="shrink-0 rounded-full bg-black/5 p-1 transition-colors hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
}

// ─── Marquee Component ──────────────────────────────────

function MarqueeAnnouncement({
    ann,
    onDismiss,
    onLinkClick,
}: {
    ann: Announcement;
    onDismiss: (trackDismiss?: boolean, dismissReason?: string) => void;
    onLinkClick: () => void;
}) {
    return (
        <motion.div
            {...getContainerMotion("marquee", ann.template)}
            className={`relative overflow-hidden ${templateStyles[ann.template] || templateStyles.gold}`}
        >
            <div className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:block">
                <TemplateSignal template={ann.template} />
            </div>
            <div className="wusha-marquee-track py-2 whitespace-nowrap">
                <AnnouncementMedia ann={ann} variant="marquee" />
                <span className="inline-block px-8 text-sm font-bold">{ann.title}</span>
                <span className="inline-block px-8 text-sm opacity-80">{ann.body}</span>
                {ann.link && ann.linkText && (
                    <Link href={ann.link} onClick={onLinkClick} className="inline-block px-8 text-sm font-bold underline">{ann.linkText}</Link>
                )}
                <span className="inline-block px-8 text-sm font-bold">{ann.title}</span>
                <span className="inline-block px-8 text-sm opacity-80">{ann.body}</span>
            </div>
            {ann.trigger?.dismissible && (
                <button onClick={() => onDismiss(true, "marquee_close")} className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/5 p-1 transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
                    <X className="w-3 h-3" />
                </button>
            )}
        </motion.div>
    );
}

// ═══ MAIN RENDERER ══════════════════════════════════════

export function AnnouncementRenderer({ announcements }: { announcements: Announcement[] }) {
    const pathname = usePathname();
    const [visible, setVisible] = useState<Record<string, boolean>>({});
    const [ready, setReady] = useState(false);
    const orderedAnnouncements = useMemo(
        () => [...announcements].sort((left, right) => left.priority - right.priority),
        [announcements]
    );
    const markVisible = useCallback((announcementId: string) => {
        setVisible((current) => {
            if (current[announcementId]) return current;
            return { ...current, [announcementId]: true };
        });
    }, []);

    // Initialize on mount
    useEffect(() => {
        setReady(true);
    }, []);

    // ─── Trigger engine ─────────────────────────────────
    useEffect(() => {
        if (!ready) return;
        const timers: number[] = [];
        const cleanupCallbacks: Array<() => void> = [];

        orderedAnnouncements.forEach((ann) => {
            const trigger = ann.trigger;
            if (!trigger) return;

            // Check if already dismissed
            if (isDismissed(ann.id, trigger.frequency)) return;

            switch (trigger.type) {
                case "always":
                case "on_load":
                    markVisible(ann.id);
                    break;

                case "after_delay": {
                    const delay = (trigger.delaySeconds || 5) * 1000;
                    const t = window.setTimeout(() => {
                        if (!isDismissed(ann.id, trigger.frequency)) {
                            markVisible(ann.id);
                        }
                    }, delay);
                    timers.push(t);
                    break;
                }

                case "page_enter": {
                    if (matchesAnnouncementPath(pathname, trigger.targetPages)) {
                        markVisible(ann.id);
                    }
                    break;
                }

                case "exit_intent": {
                    const handler = (e: MouseEvent) => {
                        if (e.clientY <= 5) {
                            if (!isDismissed(ann.id, trigger.frequency)) {
                                markVisible(ann.id);
                            }
                            document.removeEventListener("mouseleave", handler);
                        }
                    };
                    document.addEventListener("mouseleave", handler);
                    cleanupCallbacks.push(() => document.removeEventListener("mouseleave", handler));
                    break;
                }

                case "scroll_depth": {
                    const pct = trigger.scrollPercent || 50;
                    const handler = () => {
                        const scrollTop = window.scrollY;
                        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                        if (docHeight > 0 && (scrollTop / docHeight) * 100 >= pct) {
                            if (!isDismissed(ann.id, trigger.frequency)) {
                                markVisible(ann.id);
                            }
                            window.removeEventListener("scroll", handler);
                        }
                    };
                    window.addEventListener("scroll", handler, { passive: true });
                    cleanupCallbacks.push(() => window.removeEventListener("scroll", handler));
                    break;
                }
            }
        });

        return () => {
            timers.forEach((t) => clearTimeout(t));
            cleanupCallbacks.forEach((callback) => callback());
        };
    }, [markVisible, orderedAnnouncements, pathname, ready]);

    // Re-evaluate page_enter on pathname change
    useEffect(() => {
        if (!ready) return;
        orderedAnnouncements.forEach((ann) => {
            if (ann.trigger?.type === "page_enter") {
                if (matchesAnnouncementPath(pathname, ann.trigger.targetPages)) {
                    if (!isDismissed(ann.id, ann.trigger.frequency)) {
                        markVisible(ann.id);
                    }
                }
            }
        });
    }, [markVisible, pathname, orderedAnnouncements, ready]);

    const handleDismiss = useCallback((ann: Announcement, trackDismiss = false, dismissReason?: string) => {
        setVisible((v) => ({ ...v, [ann.id]: false }));
        if (ann.trigger) {
            setDismissed(ann.id, ann.trigger.frequency);
            if (ann.trigger.frequency === "session") {
                dismissSession(ann.id);
            }
        }
        if (trackDismiss) {
            trackAnnouncementEvent("dismiss", ann, pathname, {
                dismiss_reason: dismissReason ?? "manual",
            });
        }
    }, [pathname]);

    const visibleAnnouncements = orderedAnnouncements.filter(
        (announcement) => visible[announcement.id] && canRenderOnCurrentPath(announcement, pathname)
    );

    // Split by type for rendering
    const banners = visibleAnnouncements.filter((a) => a.type === "banner").slice(0, 2);
    const marquees = visibleAnnouncements.filter((a) => a.type === "marquee").slice(0, 1);
    const popups = visibleAnnouncements.filter((a) => a.type === "popup").slice(0, 1);
    const toasts = visibleAnnouncements.filter((a) => a.type === "toast").slice(0, 1);
    const renderedAnnouncements = [...banners, ...marquees, ...popups, ...toasts];

    useEffect(() => {
        if (!ready) return;
        renderedAnnouncements.forEach((announcement) => {
            if (wasViewTrackedForPath(announcement.id, pathname)) return;
            markViewTrackedForPath(announcement.id, pathname);
            trackAnnouncementEvent("view", announcement, pathname);
        });
    }, [pathname, ready, renderedAnnouncements]);

    const handleLinkClick = useCallback((announcement: Announcement) => {
        trackAnnouncementEvent("click", announcement, pathname);
    }, [pathname]);

    if (!ready) return null;

    return (
        <>
            {/* Banners — top of page */}
            {banners.map((a) => (
                <BannerAnnouncement key={a.id} ann={a} onDismiss={(trackDismiss, dismissReason) => handleDismiss(a, trackDismiss, dismissReason)} onLinkClick={() => handleLinkClick(a)} />
            ))}

            {/* Marquees — under banners */}
            {marquees.map((a) => (
                <MarqueeAnnouncement key={a.id} ann={a} onDismiss={(trackDismiss, dismissReason) => handleDismiss(a, trackDismiss, dismissReason)} onLinkClick={() => handleLinkClick(a)} />
            ))}

            {/* Popups — modal overlay */}
            {popups.length > 0 && (
                <PopupAnnouncement ann={popups[0]} onDismiss={(trackDismiss, dismissReason) => handleDismiss(popups[0], trackDismiss, dismissReason)} onLinkClick={() => handleLinkClick(popups[0])} />
            )}

            {/* Toasts — bottom corner */}
            {toasts.map((a) => (
                <ToastAnnouncement key={a.id} ann={a} onDismiss={(trackDismiss, dismissReason) => handleDismiss(a, trackDismiss, dismissReason)} onLinkClick={() => handleLinkClick(a)} />
            ))}
        </>
    );
}
