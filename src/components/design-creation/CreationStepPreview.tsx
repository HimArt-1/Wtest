"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DesignCreationState } from "@/lib/design-creation";

interface CreationStepPreviewProps {
  state: DesignCreationState;
  onBack: () => void;
  onOrder: () => void;
}

export function CreationStepPreview({ state, onBack, onOrder }: CreationStepPreviewProps) {
  const router = useRouter();

  const handleOrder = () => {
    // TODO: إضافة المنتج للسلة ثم التوجيه للدفع
    // حالياً: التوجيه لصفحة الدفع
    router.push("/checkout");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-2xl font-bold text-fg mb-1">معاينة التصميم</h2>
        <p className="text-fg/60 text-sm">تأكد من التصميم ثم اطلب قطعتك</p>
      </div>

      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <p className="text-sm text-fg/70">
          تصفح المعاينة على اليمين — يمكنك تعديل الموضع أو اللون من الخطوات السابقة
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={handleOrder}
          className="btn-gold w-full py-4 flex items-center justify-center gap-2 text-lg font-bold"
        >
          <ShoppingBag className="w-6 h-6" />
          اطلب الآن
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl border border-white/20 text-fg/80 hover:bg-white/5"
        >
          <ChevronLeft className="w-4 h-4 inline ml-1" />
          تعديل التصميم
        </button>
      </div>
    </motion.div>
  );
}
