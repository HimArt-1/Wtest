"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle, Loader2 } from "lucide-react";

interface JoinModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const clothingOptions = [
    { id: "thobe_shimagh", label: "ثوب وشماغ" },
    { id: "tshirt", label: "تيشيرت" },
    { id: "hoodie", label: "هودي" },
    { id: "plain_thobe", label: "ثوب سادة" },
];

export function JoinModal({ isOpen, onClose }: JoinModalProps) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [clothing, setClothing] = useState<string[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const toggleClothing = (id: string) => {
        setClothing((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;

        setStatus("loading");
        try {
            const { submitJoinForm } = await import("@/app/actions/join");
            const result = await submitJoinForm({ name, email, phone, clothing });
            if (result.success) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMsg(result.message);
            }
        } catch {
            setStatus("error");
            setErrorMsg("حدث خطأ، حاول مرة أخرى");
        }
    };

    const handleClose = () => {
        if (status !== "loading") {
            onClose();
            // Reset after animation
            setTimeout(() => {
                setName("");
                setEmail("");
                setPhone("");
                setClothing([]);
                setStatus("idle");
                setErrorMsg("");
            }, 300);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[90] flex items-center justify-center p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={handleClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative w-full max-w-md bg-[#111] border border-gold/20 rounded-2xl overflow-hidden shadow-2xl shadow-gold/5"
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        dir="rtl"
                    >
                        {/* Header gradient */}
                        <div className="h-1 bg-gradient-to-r from-gold/60 via-gold to-gold/60" />

                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-white/10 transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>

                        <div className="p-6 sm:p-8">
                            {status === "success" ? (
                                /* ─── Success State ─── */
                                <motion.div
                                    className="text-center py-8"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", damping: 20 }}
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring", damping: 15 }}
                                    >
                                        <CheckCircle className="w-16 h-16 text-gold mx-auto mb-4" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        تم التسجيل بنجاح!
                                    </h3>
                                    <p className="text-white/60 text-sm">
                                        شكراً لانضمامك، سنتواصل معك قريباً
                                    </p>
                                    <button
                                        onClick={handleClose}
                                        className="mt-6 px-6 py-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors text-sm"
                                    >
                                        إغلاق
                                    </button>
                                </motion.div>
                            ) : (
                                /* ─── Form State ─── */
                                <>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                                        انضم إلى وشّى
                                    </h2>
                                    <p className="text-white/50 text-sm mb-6">
                                        سجّل اهتمامك وكن من أوائل المنضمين
                                    </p>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {/* Name */}
                                        <div>
                                            <label className="block text-sm text-white/70 mb-1.5">
                                                الاسم <span className="text-gold">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder="اسمك الكامل"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-colors"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm text-white/70 mb-1.5">
                                                البريد الإلكتروني <span className="text-gold">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="example@email.com"
                                                dir="ltr"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-colors text-left"
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm text-white/70 mb-1.5">
                                                رقم الجوال
                                            </label>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="05XXXXXXXX"
                                                dir="ltr"
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/20 transition-colors text-left"
                                            />
                                        </div>

                                        {/* Clothing Preference */}
                                        <div>
                                            <label className="block text-sm text-white/70 mb-2.5">
                                                وش تحب تلبس؟{" "}
                                                <span className="text-white/30">(اختياري)</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {clothingOptions.map((option) => {
                                                    const isSelected = clothing.includes(option.id);
                                                    return (
                                                        <button
                                                            key={option.id}
                                                            type="button"
                                                            onClick={() => toggleClothing(option.id)}
                                                            className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isSelected
                                                                    ? "border-gold/50 bg-gold/10 text-gold shadow-[0_0_12px_rgba(206,174,127,0.1)]"
                                                                    : "border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/8"
                                                                }`}
                                                        >
                                                            {option.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Error */}
                                        {status === "error" && (
                                            <motion.p
                                                className="text-red-400 text-sm text-center bg-red-400/10 rounded-lg py-2"
                                                initial={{ opacity: 0, y: -5 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {errorMsg}
                                            </motion.p>
                                        )}

                                        {/* Submit */}
                                        <button
                                            type="submit"
                                            disabled={status === "loading" || !name.trim() || !email.trim()}
                                            className="w-full py-3.5 bg-gradient-to-r from-[#ceae7f] to-[#b8964f] text-[#0a0a0a] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(206,174,127,0.25)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {status === "loading" ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    جاري الإرسال...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    سجّل الآن
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
