"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, RefreshCw, Heart } from "lucide-react";
import Image from "next/image";

const aiSuggestions = [
  {
    id: 1,
    title: "بناءً على ذوقك الفني",
    items: [
      {
        title: "أزهار الصحراء",
        artist: "منى الحربي",
        match: "٩٢%",
        image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=80",
      },
      {
        title: "ليلة في الرياض",
        artist: "عبدالله السالم",
        match: "٨٨%",
        image: "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&q=80",
      },
      {
        title: "حروف نورانية",
        artist: "هدى المنصور",
        match: "٨٥%",
        image: "https://images.unsplash.com/photo-1578926288207-a90a5366759d?w=400&q=80",
      },
    ],
  },
];

const typingPhrases = [
  "أبحث عن لوحات تراثية...",
  "فنانون من الخليج...",
  "أعمال بألوان دافئة...",
  "خط عربي معاصر...",
];

export function AISection() {
  const [displayText, setDisplayText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const phraseIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const phaseRef = useRef<"typing" | "pausing" | "deleting">("typing");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tick = useCallback(() => {
    const phrase = typingPhrases[phraseIndexRef.current];

    if (phaseRef.current === "typing") {
      if (charIndexRef.current <= phrase.length) {
        setDisplayText(phrase.slice(0, charIndexRef.current));
        charIndexRef.current++;
        timerRef.current = setTimeout(tick, 80);
      } else {
        phaseRef.current = "pausing";
        timerRef.current = setTimeout(tick, 2000);
      }
    } else if (phaseRef.current === "pausing") {
      phaseRef.current = "deleting";
      timerRef.current = setTimeout(tick, 40);
    } else if (phaseRef.current === "deleting") {
      if (charIndexRef.current > 0) {
        charIndexRef.current--;
        setDisplayText(phrase.slice(0, charIndexRef.current));
        timerRef.current = setTimeout(tick, 40);
      } else {
        phraseIndexRef.current = (phraseIndexRef.current + 1) % typingPhrases.length;
        charIndexRef.current = 0;
        phaseRef.current = "typing";
        timerRef.current = setTimeout(tick, 300);
      }
    }
  }, []);

  useEffect(() => {
    timerRef.current = setTimeout(tick, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tick]);

  const handleSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1500);
  };

  const [particles, setParticles] = useState<Array<{ id: number; top: number; left: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    setParticles(
      [...Array(15)].map((_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: 3 + Math.random() * 3,
        delay: Math.random() * 2,
      }))
    );
  }, []);

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Section Divider */}
      <div className="section-divider mb-24" />

      {/* Subtle Background Gradient — theme-aware */}
      <div className="absolute inset-0 bg-theme-gradient" />

      {/* Gold Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-0.5 h-0.5 bg-gold/40 rounded-full"
            style={{
              top: `${particle.top}%`,
              left: `${particle.left}%`,
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      <div className="container-wusha relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold/60 tracking-[0.3em] uppercase">
              مدعوم بالذكاء الاصطناعي
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="text-gradient">اكتشف بذكاء</span>
          </h2>
          <p className="text-theme-subtle max-w-xl mx-auto">
            خوارزميات متقدمة تفهم ذوقك وتقترح أعمالاً تناسبك
          </p>
        </motion.div>

        {/* AI Search Interface */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Search Box */}
          <div className="relative mb-12">
            <div className="glass-card rounded-2xl p-2 border-gold/15">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 relative">
                  <Wand2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold" />
                  <input
                    type="text"
                    value={displayText}
                    readOnly
                    className="w-full bg-transparent pr-12 pl-4 py-3 sm:py-4 text-base sm:text-lg focus:outline-none text-theme-strong placeholder:text-theme-subtle"
                    placeholder="اسأل الذكاء الاصطناعي..."
                  />
                  <motion.span
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </div>
                <motion.button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-gold to-[#b8964f] text-[#0a0a0a] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold hover:shadow-[0_0_30px_rgba(206,174,127,0.3)] transition-all duration-500 shrink-0"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    "ابحث"
                  )}
                </motion.button>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["تراثي", "معاصر", "تجريدي", "طبيعة", "بورتريه"].map((tag) => (
                <button
                  key={tag}
                  className="px-4 py-2 bg-theme-subtle rounded-full text-sm text-theme-subtle hover:bg-[color-mix(in_srgb,var(--wusha-gold)_10%,transparent)] hover:text-[color-mix(in_srgb,var(--wusha-gold)_80%,transparent)] transition-all duration-300 border border-theme-soft"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-theme-strong">
                    {aiSuggestions[0].title}
                  </h3>
                  <button
                    onClick={() => setShowResults(false)}
                    className="text-sm text-gold hover:underline"
                  >
                    بحث جديد
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiSuggestions[0].items.map((item, index) => (
                    <motion.div
                      key={item.title}
                      className="group glass-card rounded-xl overflow-hidden cursor-pointer hover:border-gold/30"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-gold to-[#b8964f] text-[#0a0a0a] text-xs font-bold rounded-full">
                          تطابق {item.match}
                        </div>
                        <button className="absolute top-3 left-3 w-8 h-8 rounded-full bg-theme-subtle backdrop-blur-sm flex items-center justify-center hover:bg-[var(--wusha-gold)] hover:text-[var(--wusha-bg)] transition-all">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold mb-1 text-theme-strong">{item.title}</h4>
                        <p className="text-sm text-theme-subtle">
                          {item.artist}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Features */}
          {!showResults && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              {[
                {
                  icon: "🎨",
                  title: "تحليل الذوق",
                  desc: "نتعلم من تفاعلاتك لتحسين الاقتراحات",
                },
                {
                  icon: "🔍",
                  title: "بحث ذكي",
                  desc: "اكتب ما تريد بأي طريقة وسنفهم",
                },
                {
                  icon: "✨",
                  title: "اكتشاف جديد",
                  desc: "أعمال مخفية تناسب ذوقك تنتظرك",
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="text-center p-6 glass-card rounded-xl"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                >
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h4 className="font-bold mb-2 text-theme-strong">{feature.title}</h4>
                  <p className="text-sm text-theme-subtle">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
