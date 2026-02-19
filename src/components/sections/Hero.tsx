"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { JoinModal } from "@/components/ui/JoinModal";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [curtainLifted, setCurtainLifted] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const router = useRouter();

  // ─── Secret Admin Access: 5 rapid taps on logo ───
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSecretTap = useCallback(() => {
    tapCountRef.current += 1;

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);

    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      router.push("/dashboard");
      return;
    }

    // Reset counter after 2 seconds of no taps
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2000);
  }, [router]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Handle video ready state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => setVideoReady(true);

    // If already loaded (cached)
    if (video.readyState >= 3) {
      setVideoReady(true);
    } else {
      video.addEventListener("canplay", onCanPlay);
    }

    // Safety timeout — lift curtain after 4s no matter what
    const fallback = setTimeout(() => setVideoReady(true), 4000);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      clearTimeout(fallback);
    };
  }, []);

  // Lift curtain 600ms after video is ready (let animation breathe)
  useEffect(() => {
    if (!videoReady) return;
    const timer = setTimeout(() => setCurtainLifted(true), 600);
    return () => clearTimeout(timer);
  }, [videoReady]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen min-h-[100dvh] flex items-center justify-center overflow-hidden px-2 sm:px-0"
    >
      {/* ═══ Loading Curtain ═══ */}
      <AnimatePresence>
        {!curtainLifted && (
          <motion.div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080808]"
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Animated Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <motion.div
                animate={{
                  filter: videoReady ? "blur(0px)" : ["blur(0px)", "blur(2px)", "blur(0px)"],
                }}
                transition={{ duration: 2, repeat: videoReady ? 0 : Infinity, ease: "easeInOut" }}
              >
                <Image
                  src="/hero-logo.png"
                  alt="وشّى"
                  width={280}
                  height={160}
                  className="object-contain brightness-0 invert sepia saturate-[2] hue-rotate-[5deg] opacity-90 w-[180px] sm:w-[220px] md:w-[280px] h-auto"
                  priority
                />
              </motion.div>

              {/* Gold shimmer line under logo */}
              <motion.div
                className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mt-4 mx-auto"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
              />
            </motion.div>

            {/* Loading indicator */}
            <motion.div
              className="mt-8 flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* Three pulsing dots */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gold/60"
                  animate={{
                    opacity: videoReady ? 0 : [0.3, 1, 0.3],
                    scale: videoReady ? 0 : [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: videoReady ? 0 : Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>

            {/* Ready checkmark flash */}
            <AnimatePresence>
              {videoReady && (
                <motion.span
                  className="absolute bottom-[40%] text-gold/40 text-sm tracking-[0.3em]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  فنٌ يرتدى
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Video Background ═══ */}
      <motion.div className="absolute inset-0 z-0" style={{ scale: videoScale }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="video-bg"
        >
          <source src="/videos/HERO1.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* ═══ Video Overlay — Gradient ═══ */}
      <div className="video-overlay" />

      {/* ═══ Subtle Gold Particles ═══ */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-1 h-1 rounded-full bg-gold/40"
          style={{ top: "20%", right: "15%" }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-1.5 h-1.5 rounded-full bg-gold/30"
          style={{ top: "60%", right: "80%" }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute w-0.5 h-0.5 rounded-full bg-gold/50"
          style={{ top: "40%", right: "50%" }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* ═══ Main Content ═══ */}
      <motion.div
        className="relative z-10 container-wusha text-center px-4 sm:px-6"
        style={{ y, opacity, scale }}
      >
        {/* Main Title */}
        <motion.div
          className="mb-2 sm:mb-3 mt-16 sm:mt-20 md:mt-24 flex justify-center cursor-pointer select-none"
          initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
          animate={curtainLifted ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleSecretTap}
        >
          <Image
            src="/hero-logo.png"
            alt="وشّى"
            width={450}
            height={260}
            className="object-contain brightness-0 invert sepia saturate-[2] hue-rotate-[5deg] w-[180px] sm:w-[250px] md:w-[350px] lg:w-[450px] h-auto drop-shadow-[0_0_40px_rgba(206,174,127,0.25)]"
            priority
            draggable={false}
          />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-2xl mx-auto mb-10 sm:mb-14 font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={curtainLifted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          فنٌ يرتدى
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={curtainLifted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <motion.button
            className="btn-gold group relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/studio/design-piece")}
          >
            <span className="relative z-10 flex items-center gap-2">
              ابدأ التصميم
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ←
              </motion.span>
            </span>
          </motion.button>

          <motion.button
            className="btn-secondary backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setJoinOpen(true)}
          >
            انضم معنا
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Join Modal */}
      <JoinModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-10 hidden sm:block"
        initial={{ opacity: 0 }}
        animate={curtainLifted ? { opacity: 1 } : {}}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2 text-white/30"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs tracking-widest">اكتشف المزيد</span>
          <ArrowDown className="w-4 h-4" />
        </motion.div>
      </motion.div>

      {/* Decorative Gold Lines */}
      <motion.div
        className="absolute top-1/4 right-10 w-px h-32 bg-gradient-to-b from-transparent via-gold/20 to-transparent hidden lg:block z-10"
        initial={{ scaleY: 0 }}
        animate={curtainLifted ? { scaleY: 1 } : {}}
        transition={{ duration: 1.5, delay: 1.2 }}
      />
      <motion.div
        className="absolute top-1/3 left-10 w-px h-24 bg-gradient-to-b from-transparent via-gold/10 to-transparent hidden lg:block z-10"
        initial={{ scaleY: 0 }}
        animate={curtainLifted ? { scaleY: 1 } : {}}
        transition={{ duration: 1.5, delay: 1.5 }}
      />
    </section>
  );
}
