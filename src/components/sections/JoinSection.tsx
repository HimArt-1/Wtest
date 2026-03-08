"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle,
  ArrowLeft,
  Palette,
  Award,
  Users,
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react";
import { submitApplication, type ActionResponse } from "@/app/actions/forms";

const benefits = [
  {
    icon: Palette,
    title: "معرض شخصي",
    description: "صفحة بورتفوليو احترافية تعكس هويتك الفنية",
  },
  {
    icon: TrendingUp,
    title: "دخل مستدام",
    description: "بيع أعمالك مباشرة مع عمولة منخفضة",
  },
  {
    icon: Users,
    title: "مجتمع داعم",
    description: "تواصل مع فنانين ومشترين من العالم العربي",
  },
  {
    icon: Award,
    title: "فرص مميزة",
    description: "معارض، مسابقات، وتعاونات حصرية",
  },
];

const steps = [
  "أرسل أعمالك",
  "مراجعة الفريق",
  "القبول والانطلاق",
];

export function JoinSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<ActionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResponse(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitApplication(formData);

    setResponse(result);
    setIsSubmitting(false);
  };

  return (
    <section id="join" className="py-16 sm:py-32 relative overflow-hidden">
      {/* Section Divider */}
      <div className="section-divider mb-16 sm:mb-24" />

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-mist/5 rounded-full blur-[120px]" />

      <div className="container-wusha relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 items-start">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-sm font-medium text-gold/60 tracking-[0.3em] uppercase">
              انضم إلى المجتمع
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
              كن جزءاً من
              <span className="text-gradient block">وشّى</span>
            </h2>
            <p className="text-theme-subtle text-lg mb-8">
              نبحث عن فنانين موهوبين يشاركوننا رؤيتنا في تشكيل مستقبل الفن العربي الرقمي
            </p>

            {/* Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/10 flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h4 className="font-bold mb-1 text-theme-strong">{benefit.title}</h4>
                    <p className="text-sm text-theme-subtle">
                      {benefit.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Process Steps */}
            <div className="glass-card rounded-xl p-4 sm:p-6">
              <h4 className="font-bold mb-4 text-theme-strong">كيف يعمل نظام القبول؟</h4>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gold to-[#b8964f] text-[#0a0a0a] flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm text-theme-soft">{step}</span>
                    {index < steps.length - 1 && (
                      <ArrowLeft className="w-4 h-4 text-theme-subtle mx-2 hidden sm:block" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right - Form */}
          <motion.div
            className="glass-card rounded-2xl p-5 sm:p-8 border-gold/10"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {response?.success ? (
                <motion.div
                  key="success"
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="w-20 h-20 rounded-full bg-forest/20 flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <CheckCircle className="w-10 h-10 text-forest" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-3 text-theme-strong">تم إرسال طلبك بنجاح!</h3>
                  <p className="text-theme-subtle">
                    {response.message}
                  </p>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="space-y-5"
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <h3 className="text-2xl font-bold mb-6 text-theme-strong">تقديم طلب الانضمام</h3>

                  {response && !response.success && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-lg flex items-start gap-2 text-sm border border-red-500/20">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <p className="font-bold">{response.message}</p>
                        {response.errors && (
                          <ul className="list-disc list-inside mt-1">
                            {Object.values(response.errors).flat().map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      الاسم الكامل
                    </label>
                    <input
                      name="full_name"
                      type="text"
                      required
                      className="input-dark w-full px-4 py-3 rounded-lg"
                      placeholder="اسمك الكامل"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      البريد الإلكتروني
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="input-dark w-full px-4 py-3 rounded-lg"
                      placeholder="email@example.com"
                      dir="ltr"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      رقم الهاتف
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      className="input-dark w-full px-4 py-3 rounded-lg"
                      placeholder="+966..."
                      dir="ltr"
                    />
                  </div>

                  {/* Specialty */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      التخصص الفني
                    </label>
                    <select
                      name="art_style"
                      required
                      className="input-dark w-full px-4 py-3 rounded-lg"
                    >
                      <option value="">اختر تخصصك</option>
                      <option value="digital">فن رقمي</option>
                      <option value="photography">تصوير فوتوغرافي</option>
                      <option value="calligraphy">خط عربي</option>
                      <option value="traditional">فن تقليدي</option>
                      <option value="conceptual">فن مفاهيمي</option>
                      <option value="mixed">وسائط متعددة</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Portfolio URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-theme-soft">
                        رابط البورتفوليو
                      </label>
                      <input
                        name="portfolio_url"
                        type="url"
                        className="input-dark w-full px-4 py-3 rounded-lg"
                        placeholder="https://..."
                        dir="ltr"
                      />
                    </div>
                    {/* Instagram */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-theme-soft">
                        انستقرام
                      </label>
                      <input
                        name="instagram_url"
                        type="text"
                        className="input-dark w-full px-4 py-3 rounded-lg"
                        placeholder="@username"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      سنوات الخبرة
                    </label>
                    <input
                      name="experience_years"
                      type="number"
                      min="0"
                      className="input-dark w-full px-4 py-3 rounded-lg"
                      placeholder="0"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium mb-2 text-theme-soft">
                      لماذا تريد الانضمام؟
                    </label>
                    <textarea
                      name="motivation"
                      required
                      rows={4}
                      className="input-dark w-full px-4 py-3 rounded-lg resize-none"
                      placeholder="أخبرنا عن نفسك وفنك..."
                    />
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    className="w-full btn-gold disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري الإرسال...
                      </span>
                    ) : (
                      "إرسال الطلب"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
