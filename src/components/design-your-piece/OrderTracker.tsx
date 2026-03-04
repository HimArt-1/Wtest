"use client";

// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — Order Tracker + Results Popup
//  تتبع الطلب + نافذة النتائج المذهلة
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock, Check, Loader2, X, Eye,
    Shirt, Palette, Ruler, Sparkles, Paintbrush, SwatchBook,
    FileText, Download, MessageCircle,
    AlertCircle, CheckCircle2, Ban,
    ShoppingCart, MapPin, Maximize2, Minimize2,
    ChevronLeft, ChevronRight,
} from "lucide-react";
import {
    getDesignOrderPublic,
    approveDesignOrder,
    cancelDesignOrderByCustomer,
    getGarmentPricing,
    confirmDesignOrder,
} from "@/app/actions/smart-store";
import { useCartStore } from "@/stores/cartStore";
import type { CustomDesignOrder, CustomDesignOrderStatus } from "@/types/database";

// ─── localStorage Keys ──────────────────────────────────

const STORAGE_KEY = "wusha_design_order_id";

export function getStoredOrderId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
}

export function storeOrderId(id: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, id);
}

export function clearOrderId() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
}

// ─── Status Config ──────────────────────────────────────

const STATUS_CONFIG: Record<CustomDesignOrderStatus, {
    label: string; desc: string; color: string; bg: string; icon: any; step: number;
}> = {
    new: {
        label: "تم استلام الطلب",
        desc: "تم تلقي طلبك وسيبدأ فريقنا بالعمل عليه قريباً",
        color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Clock, step: 1,
    },
    in_progress: {
        label: "قيد التنفيذ",
        desc: "فريق التصميم يعمل على طلبك الآن",
        color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Loader2, step: 2,
    },
    awaiting_review: {
        label: "جاهز للمراجعة",
        desc: "تم الانتهاء من التصميم — راجع النتائج وحدد موقع الطباعة",
        color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", icon: Eye, step: 3,
    },
    completed: {
        label: "مكتمل ✅",
        desc: "تم اعتماد التصميم وإضافته للسلة",
        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, step: 4,
    },
    cancelled: {
        label: "ملغي",
        desc: "تم إلغاء هذا الطلب",
        color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: Ban, step: 0,
    },
};

const PROGRESS_STEPS = [
    { label: "تم الاستلام", status: "new" as const },
    { label: "قيد التنفيذ", status: "in_progress" as const },
    { label: "جاهز للمراجعة", status: "awaiting_review" as const },
    { label: "مكتمل", status: "completed" as const },
];

// ─── Print Positions ────────────────────────────────────

type PrintPosition = "chest" | "back" | "shoulder_right" | "shoulder_left";
type PrintSize = "large" | "small";

const POSITIONS: { id: PrintPosition; label: string; emoji: string; desc: string }[] = [
    { id: "chest", label: "الصدر", emoji: "👕", desc: "تصميم على الجهة الأمامية" },
    { id: "back", label: "الظهر", emoji: "🔄", desc: "تصميم على الجهة الخلفية" },
    { id: "shoulder_right", label: "الكتف الأيمن", emoji: "➡️", desc: "شعار على الكتف الأيمن" },
    { id: "shoulder_left", label: "الكتف الأيسر", emoji: "⬅️", desc: "شعار على الكتف الأيسر" },
];

const SIZE_LABELS: Record<PrintSize, { label: string; desc: string }> = {
    large: { label: "مقاس كبير", desc: "تغطية واسعة وبارزة" },
    small: { label: "مقاس صغير", desc: "تصميم أنيق ومحدود" },
};

function getPrice(pricing: any, position: PrintPosition, size: PrintSize): number {
    if (position === "shoulder_right" || position === "shoulder_left") {
        return size === "large" ? (pricing?.price_shoulder_large ?? 0) : (pricing?.price_shoulder_small ?? 0);
    }
    if (position === "back") {
        return size === "large" ? (pricing?.price_back_large ?? 0) : (pricing?.price_back_small ?? 0);
    }
    return size === "large" ? (pricing?.price_chest_large ?? 0) : (pricing?.price_chest_small ?? 0);
}

// ─── Main Component ─────────────────────────────────────

export function OrderTracker({ orderId }: { orderId: string }) {
    const [order, setOrder] = useState<CustomDesignOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showResultsPopup, setShowResultsPopup] = useState(false);

    const fetchOrder = useCallback(async () => {
        const data = await getDesignOrderPublic(orderId);
        setOrder(data);
        setLoading(false);

        // Auto-show popup when results are ready
        if (data && data.status === "awaiting_review" && !showResultsPopup) {
            setShowResultsPopup(true);
        }
    }, [orderId, showResultsPopup]);

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 15000);
        return () => clearInterval(interval);
    }, [fetchOrder]);

    const handleCancel = async () => {
        if (!order || !confirm("هل أنت متأكد من إلغاء الطلب؟ لا يمكن التراجع.")) return;
        setActionLoading(true);
        await cancelDesignOrderByCustomer(order.id);
        await fetchOrder();
        setActionLoading(false);
    };

    const handleNewOrder = () => {
        clearOrderId();
        window.location.reload();
    };

    // Toggle Reamaze chat visibility based on order status
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (order && !["completed", "cancelled"].includes(order.status)) {
            document.body.classList.add("reamaze-active");
        } else {
            document.body.classList.remove("reamaze-active");
        }
        return () => { document.body.classList.remove("reamaze-active"); };
    }, [order]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin mb-4" />
                <p className="text-fg/40 text-sm">جاري تحميل حالة الطلب...</p>
            </div>
        );
    }

    if (!order) {
        clearOrderId();
        return (
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 mx-auto text-fg/20 mb-4" />
                <p className="text-fg/50 mb-4">لم يتم العثور على الطلب</p>
                <button onClick={handleNewOrder} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-gold to-gold-light text-bg font-bold text-sm">
                    ابدأ طلب جديد
                </button>
            </div>
        );
    }

    const st = STATUS_CONFIG[order.status];
    const currentStep = st.step;
    const isTerminal = order.status === "completed" || order.status === "cancelled";

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Results Popup */}
            <AnimatePresence>
                {showResultsPopup && order.status === "awaiting_review" && (
                    <DesignResultsPopup
                        order={order}
                        onClose={() => setShowResultsPopup(false)}
                        onConfirm={async () => { await fetchOrder(); setShowResultsPopup(false); }}
                        onCancel={handleCancel}
                    />
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-l from-gold via-gold-light to-gold bg-clip-text text-transparent">
                    طلبك #{order.order_number}
                </h1>
                <p className="text-fg/50 mt-2 text-sm">تتبع حالة تصميمك المخصص</p>
            </motion.div>

            {/* Progress Timeline */}
            {order.status !== "cancelled" && (
                <div className="relative">
                    <div className="flex items-center justify-between">
                        {PROGRESS_STEPS.map((ps, i) => {
                            const isDone = currentStep > (i + 1);
                            const isCurrent = currentStep === (i + 1);
                            return (
                                <div key={ps.status} className="flex-1 flex flex-col items-center relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isDone ? "bg-gold text-bg" : isCurrent ? "bg-gold/20 text-gold border-2 border-gold animate-pulse" : "bg-white/[0.06] text-fg/25"}`}>
                                        {isDone ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                                    </div>
                                    <span className={`text-[10px] mt-2 font-medium text-center ${isCurrent ? "text-gold" : isDone ? "text-fg/60" : "text-fg/25"}`}>{ps.label}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-white/[0.08]">
                        <motion.div className="h-full bg-gradient-to-l from-gold to-gold-light rounded-full"
                            animate={{ width: `${Math.max(0, ((currentStep - 1) / (PROGRESS_STEPS.length - 1)) * 100)}%` }}
                            transition={{ duration: 0.8 }} />
                    </div>
                </div>
            )}

            {/* Status Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-6 rounded-2xl border ${st.bg}`}>
                <div className="flex items-center gap-3 mb-2">
                    <st.icon className={`w-6 h-6 ${st.color} ${order.status === "in_progress" ? "animate-spin" : ""}`} />
                    <h3 className={`text-lg font-bold ${st.color}`}>{st.label}</h3>
                </div>
                <p className="text-fg/50 text-sm">{st.desc}</p>
            </motion.div>

            {/* Order Details */}
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                <h3 className="font-bold text-fg mb-4">تفاصيل الطلب</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <MiniCard icon={Shirt} label="القطعة" value={order.garment_name} />
                    <MiniCard icon={Palette} label="اللون" value={order.color_name} color={order.color_hex} />
                    <MiniCard icon={Ruler} label="المقاس" value={order.size_name} />
                    <MiniCard icon={Sparkles} label="النمط" value={order.style_name} />
                    <MiniCard icon={Paintbrush} label="الأسلوب" value={order.art_style_name} />
                    <MiniCard icon={SwatchBook} label="الألوان" value={order.color_package_name ?? "مخصصة"} />
                </div>
            </div>

            {/* Awaiting Review — Open Popup Button */}
            {order.status === "awaiting_review" && !showResultsPopup && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                    <button onClick={() => setShowResultsPopup(true)} className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-purple-500/30 transition-all animate-pulse">
                        <Eye className="w-5 h-5 inline-block ml-2" />
                        معاينة التصميم واختيار الطباعة
                    </button>
                </motion.div>
            )}

            {/* Completed — show final summary */}
            {order.status === "completed" && (order.result_design_url || order.result_mockup_url) && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4">
                    <h3 className="font-bold text-emerald-300 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> التصميم المعتمد</h3>
                    {order.print_position && order.print_size && (
                        <div className="flex gap-3 text-xs text-fg/50">
                            <span>📍 {POSITIONS.find(p => p.id === order.print_position)?.label ?? order.print_position}</span>
                            <span>📐 {SIZE_LABELS[order.print_size as PrintSize]?.label ?? order.print_size}</span>
                            {order.final_price && <span className="text-gold font-bold">{order.final_price} ر.س</span>}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {order.result_design_url && <ResultPreview label="التصميم" url={order.result_design_url} />}
                        {order.result_mockup_url && <ResultPreview label="المعاينة" url={order.result_mockup_url} />}
                    </div>
                </div>
            )}

            {/* Terminal States — New Order */}
            {isTerminal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-4">
                    <button onClick={handleNewOrder} className="px-8 py-3 rounded-2xl bg-gradient-to-r from-gold to-gold-light text-bg font-bold text-sm hover:shadow-lg hover:shadow-gold/20 transition-all">
                        طلب تصميم جديد
                    </button>
                </motion.div>
            )}

            {/* Chat Button (active orders) */}
            {!isTerminal && (
                <div className="text-center">
                    <button onClick={() => { const btn = document.querySelector("[data-reamaze-widget]") as HTMLElement; if (btn) btn.click(); }}
                        className="flex items-center gap-2 mx-auto px-5 py-3 rounded-2xl border border-gold/20 text-gold text-sm font-medium hover:bg-gold/5 transition-colors">
                        <MessageCircle className="w-4 h-4" /> تواصل معنا بخصوص الطلب
                    </button>
                </div>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════
//  🎨 Design Results Popup — نافذة النتائج المذهلة
// ═══════════════════════════════════════════════════════════

function DesignResultsPopup({ order, onClose, onConfirm, onCancel }: {
    order: CustomDesignOrder;
    onClose: () => void;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const [position, setPosition] = useState<PrintPosition | null>(null);
    const [size, setSize] = useState<PrintSize | null>(null);
    const [pricing, setPricing] = useState<any>(null);
    const [loadingPricing, setLoadingPricing] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const addItem = useCartStore((s) => s.addItem);

    const images = [order.result_design_url, order.result_mockup_url].filter(Boolean) as string[];

    useEffect(() => {
        getGarmentPricing(order.garment_name).then((p) => {
            setPricing(p);
            setLoadingPricing(false);
        });
    }, [order.garment_name]);

    const currentPrice = position && size && pricing ? getPrice(pricing, position, size) : 0;

    const handleConfirm = async () => {
        if (!position || !size) return;
        setConfirming(true);

        await confirmDesignOrder(order.id, position, size, currentPrice);

        // Add to cart
        addItem({
            id: `custom-${order.id}`,
            title: `تصميم مخصص — ${order.garment_name}`,
            price: currentPrice,
            image_url: order.result_mockup_url || order.result_design_url || "",
            artist_name: "وشّى",
            size: order.size_name,
            type: "custom_design",
            maxQuantity: 1,
            customDesignUrl: order.result_design_url ?? undefined,
            customGarment: order.garment_name,
            customPosition: `${POSITIONS.find(p => p.id === position)?.label} — ${SIZE_LABELS[size].label}`,
        });

        setConfirming(false);
        onConfirm();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

            {/* Popup */}
            <motion.div
                initial={{ scale: 0.9, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 40 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative z-10 w-full max-w-4xl rounded-3xl overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, rgba(17,17,17,0.97) 0%, rgba(26,26,26,0.95) 100%)",
                    border: "1px solid rgba(206,174,127,0.15)",
                    boxShadow: "0 0 80px rgba(206,174,127,0.1), 0 40px 100px rgba(0,0,0,0.8)",
                }}
            >
                {/* Glow Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
                    <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gold/5 rounded-full blur-[100px]" />
                </div>

                <div className="relative p-5 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <motion.h2
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="text-2xl sm:text-3xl font-bold"
                            >
                                <span className="bg-gradient-to-l from-purple-400 via-pink-400 to-gold bg-clip-text text-transparent">
                                    ✨ تصميمك جاهز
                                </span>
                            </motion.h2>
                            <p className="text-fg/40 text-sm mt-1">طلب #{order.order_number} — {order.garment_name}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-fg/40" />
                        </button>
                    </div>

                    {/* Image Gallery */}
                    {images.length > 0 && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-black/30"
                        >
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeImage}
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.4 }}
                                    src={images[activeImage]}
                                    alt="Design"
                                    className="w-full aspect-[16/10] object-contain bg-black/50"
                                />
                            </AnimatePresence>
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, i) => (
                                        <button key={i} onClick={() => setActiveImage(i)}
                                            className={`w-3 h-3 rounded-full transition-all ${i === activeImage ? "bg-gold scale-110" : "bg-white/20 hover:bg-white/40"}`} />
                                    ))}
                                </div>
                            )}
                            {images.length > 1 && (
                                <>
                                    <button onClick={() => setActiveImage((p) => (p + 1) % images.length)} className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => setActiveImage((p) => (p - 1 + images.length) % images.length)} className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white/70 hover:text-white transition-colors">
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}

                    {/* PDF Download */}
                    {order.result_pdf_url && (
                        <a href={order.result_pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-fg/70 text-sm hover:bg-white/[0.06] transition-colors w-fit">
                            <FileText className="w-4 h-4" /> تحميل PDF <Download className="w-3.5 h-3.5" />
                        </a>
                    )}

                    {/* ═══ Print Position Selector ═══ */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-4"
                    >
                        <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gold" /> اختر موقع الطباعة
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {POSITIONS.map((pos) => {
                                const isActive = position === pos.id;
                                return (
                                    <motion.button
                                        key={pos.id}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => setPosition(pos.id)}
                                        className={`relative p-4 rounded-2xl border-2 transition-all text-center ${isActive
                                            ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                                            : "border-white/[0.08] hover:border-white/20 bg-white/[0.02]"
                                            }`}
                                    >
                                        <div className="text-3xl mb-2">{pos.emoji}</div>
                                        <p className={`text-sm font-bold ${isActive ? "text-gold" : "text-fg"}`}>{pos.label}</p>
                                        <p className="text-[10px] text-fg/35 mt-0.5">{pos.desc}</p>
                                        {isActive && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                                                <Check className="w-3.5 h-3.5 text-bg" />
                                            </motion.div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>

                    {/* ═══ Print Size Selector ═══ */}
                    <AnimatePresence>
                        {position && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-4 overflow-hidden"
                            >
                                <h3 className="text-lg font-bold text-fg flex items-center gap-2">
                                    <Maximize2 className="w-5 h-5 text-gold" /> اختر حجم الطباعة
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {(["large", "small"] as PrintSize[]).map((sz) => {
                                        const isActive = size === sz;
                                        const priceForSize = pricing ? getPrice(pricing, position, sz) : 0;
                                        return (
                                            <motion.button
                                                key={sz}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => setSize(sz)}
                                                className={`relative p-5 rounded-2xl border-2 transition-all ${isActive
                                                    ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                                                    : "border-white/[0.08] hover:border-white/20 bg-white/[0.02]"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3 mb-2">
                                                    {sz === "large"
                                                        ? <Maximize2 className={`w-8 h-8 ${isActive ? "text-gold" : "text-fg/30"}`} />
                                                        : <Minimize2 className={`w-8 h-8 ${isActive ? "text-gold" : "text-fg/30"}`} />
                                                    }
                                                    <div className="text-right">
                                                        <p className={`font-bold ${isActive ? "text-gold" : "text-fg"}`}>{SIZE_LABELS[sz].label}</p>
                                                        <p className="text-[10px] text-fg/35">{SIZE_LABELS[sz].desc}</p>
                                                    </div>
                                                </div>
                                                {!loadingPricing && (
                                                    <div className={`text-xl font-bold mt-2 ${isActive ? "text-gold" : "text-fg/60"}`}>
                                                        {priceForSize > 0 ? `${priceForSize} ر.س` : "مجاني"}
                                                    </div>
                                                )}
                                                {isActive && (
                                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                        className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                                                        <Check className="w-3.5 h-3.5 text-bg" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ═══ Price Summary + Actions ═══ */}
                    <AnimatePresence>
                        {position && size && (
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -20, opacity: 0 }}
                                className="rounded-2xl p-5 border border-gold/20"
                                style={{ background: "linear-gradient(135deg, rgba(206,174,127,0.08) 0%, rgba(206,174,127,0.02) 100%)" }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-fg/50">ملخص الطلب</p>
                                        <p className="text-xs text-fg/30 mt-1">
                                            {order.garment_name} — {POSITIONS.find(p => p.id === position)?.label} — {SIZE_LABELS[size].label}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-3xl font-bold text-gold">{currentPrice > 0 ? `${currentPrice}` : "مجاني"}</p>
                                        {currentPrice > 0 && <p className="text-xs text-fg/40">ر.س</p>}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleConfirm}
                                        disabled={confirming}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-r from-gold to-gold-light text-bg font-bold text-sm hover:shadow-lg hover:shadow-gold/30 transition-all disabled:opacity-50"
                                    >
                                        {confirming
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : <ShoppingCart className="w-5 h-5" />
                                        }
                                        {confirming ? "جاري التأكيد..." : "تأكيد وأضف للسلة 🛒"}
                                    </button>
                                    <button
                                        onClick={onCancel}
                                        disabled={confirming}
                                        className="px-5 py-4 rounded-2xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Sub Components ─────────────────────────────────────

function MiniCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color?: string }) {
    return (
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
            <div className="flex items-center justify-center mb-1.5">
                {color ? <div className="w-5 h-5 rounded-md" style={{ backgroundColor: color }} /> : <Icon className="w-4 h-4 text-fg/30" />}
            </div>
            <p className="text-[10px] text-fg/35">{label}</p>
            <p className="text-xs font-medium text-fg truncate">{value}</p>
        </div>
    );
}

function ResultPreview({ label, url }: { label: string; url: string }) {
    return (
        <div className="rounded-xl overflow-hidden border border-white/[0.08]">
            <a href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={label} className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-500" />
            </a>
            <div className="px-3 py-2 bg-white/[0.03]"><p className="text-[10px] text-fg/40">{label}</p></div>
        </div>
    );
}
