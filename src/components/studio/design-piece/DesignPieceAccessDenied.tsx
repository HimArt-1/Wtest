"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowLeft, FileCheck, Lock } from "lucide-react";

export function DesignPieceAccessDenied() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-[60vh] flex items-center justify-center px-4"
        >
            <div className="max-w-lg w-full text-center">
                {/* أيقونة */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="w-24 h-24 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-8"
                >
                    <Lock className="w-12 h-12 text-gold" />
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold text-fg mb-3">
                    تصميم قطعة متاح للمعتمدين فقط
                </h1>
                <p className="text-fg/60 text-base leading-relaxed mb-8">
                    هذه الأداة مخصّصة لأعضاء وشّى المعتمدين. قدّم طلب انضمام، وبعد الموافقة
                    ستتمكن من تصميم قطعك وتوليد ملفات PDF جاهزة للطباعة.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/join"
                        className="btn-gold inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <FileCheck className="w-5 h-5" />
                        تقديم طلب الانضمام
                    </Link>
                    <Link
                        href="/studio"
                        className="btn-secondary inline-flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        العودة للاستوديو
                    </Link>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10">
                    <p className="text-fg/40 text-sm flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold" />
                        بعد الموافقة ستظهر لك أداة «تصميم قطعة» تلقائياً
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
