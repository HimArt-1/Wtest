"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { createSupportTicket } from "@/app/actions/support-tickets";
import { SupportTicketPriority } from "@/types/database";

export function SupportDashboardClient({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Form state
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [priority, setPriority] = useState<SupportTicketPriority>("normal");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "open": return { label: "مفتوحة", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" };
            case "in_progress": return { label: "جاري المعالجة", icon: Clock, color: "text-gold", bg: "bg-gold/10 border-gold/20" };
            case "resolved": return { label: "تم الحل", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" };
            case "closed": return { label: "مغلقة", icon: X, color: "text-white/40", bg: "bg-white/5 border-white/10" };
            default: return { label: status, icon: MessageSquare, color: "text-white/60", bg: "bg-white/5 border-white/10" };
        }
    };

    const getPriorityInfo = (prio: string) => {
        switch (prio) {
            case "high": return { label: "عالية", color: "text-red-400" };
            case "normal": return { label: "عادية", color: "text-white/60" };
            case "low": return { label: "منخفضة", color: "text-white/40" };
            default: return { label: prio, color: "text-white/60" };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");
        setIsSubmitting(true);

        const res = await createSupportTicket({ subject, message, priority });

        if (!res.success) {
            setErrorMsg(res.error || "حدث خطأ ما.");
            setIsSubmitting(false);
            return;
        }

        // Optimistic refresh (in real app, either revalidatePath works or we manually add it)
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.05] p-6 rounded-2xl">
                <div>
                    <h3 className="text-lg font-bold text-white">تذاكر الدعم</h3>
                    <p className="text-white/50 text-sm mt-1">تابع حالة تذاكرك الحالية أو افتح تذكرة جديدة</p>
                </div>
                <motion.button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-gold py-2.5 px-5 flex items-center gap-2 text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Plus className="w-4 h-4" />
                    <span>تذكرة جديدة</span>
                </motion.button>
            </div>

            {tickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white/[0.01] border border-white/[0.05] rounded-3xl text-center">
                    <div className="w-20 h-20 rounded-full bg-white/[0.03] flex items-center justify-center mb-6 border border-white/[0.05]">
                        <MessageSquare className="w-8 h-8 text-white/20" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">لا توجد رسائل دعم</h3>
                    <p className="text-white/50 max-w-sm mb-6">لم تقم بإنشاء أي تذاكر دعم حتى الآن. إذا احتجت لأي مساعدة، نحن هنا بخدمتك.</p>
                    <motion.button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="text-gold font-medium hover:text-white transition-colors flex items-center gap-2"
                        whileHover={{ x: -4 }}
                    >
                        <span>إنشاء تذكرة دعم</span>
                        <Plus className="w-4 h-4" />
                    </motion.button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tickets.map((ticket, i) => {
                        const status = getStatusInfo(ticket.status);
                        const prio = getPriorityInfo(ticket.priority);
                        return (
                            <Link key={ticket.id} href={`/account/support/${ticket.id}`}>
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-gold/30 rounded-2xl p-5 sm:p-6 transition-all duration-300 group cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${status.bg} ${status.color}`}>
                                                <status.icon className="w-3 h-3" />
                                                <span>{status.label}</span>
                                            </div>
                                            <span className="text-white/40 text-xs">#{ticket.id.slice(0, 8)}</span>
                                        </div>
                                        <h4 className="text-lg font-bold text-white group-hover:text-gold transition-colors truncate">
                                            {ticket.subject}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-6 sm:justify-end shrink-0">
                                        <div className="flex flex-col gap-1 items-start sm:items-end">
                                            <span className="text-xs text-white/40">الأهمية</span>
                                            <span className={`text-sm font-medium ${prio.color}`}>{prio.label}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 items-start sm:items-end w-28">
                                            <span className="text-xs text-white/40">آخر تحديث</span>
                                            <span className="text-sm text-white/80 font-medium">
                                                {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true, locale: ar })}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Create Ticket Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#080808]/90 backdrop-blur-xl"
                            onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative bg-[#111] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 sm:p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-white">إنشاء تذكرة دعم</h3>
                                    <button
                                        onClick={() => !isSubmitting && setIsCreateModalOpen(false)}
                                        className="p-2 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {errorMsg && (
                                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-400">{errorMsg}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">الموضوع</label>
                                        <input
                                            type="text"
                                            required
                                            value={subject}
                                            onChange={e => setSubject(e.target.value)}
                                            placeholder="بخصوص ماذا تريد التواصل معنا؟"
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 focus:bg-white/[0.05] transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">مستوى الأهمية</label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { id: "low", label: "منخفضة" },
                                                { id: "normal", label: "عادية" },
                                                { id: "high", label: "عالية" },
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setPriority(p.id as any)}
                                                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${priority === p.id
                                                            ? "bg-gold/10 border-gold text-gold"
                                                            : "bg-white/[0.02] border-white/[0.08] text-white/60 hover:border-white/20"
                                                        }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-white/70">الرسالة</label>
                                        <textarea
                                            required
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                                            rows={5}
                                            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 focus:bg-white/[0.05] transition-all resize-none"
                                        />
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !subject.trim() || !message.trim()}
                                            className="flex-1 btn-gold py-3.5 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "إرسال التذكرة"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="px-6 py-3.5 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
