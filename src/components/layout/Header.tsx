"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Palette, Search, User, ShoppingBag } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { label: "المعرض", href: "/gallery" },
  { label: "المتجر", href: "/store" },
  { label: "صمّم قطعتك", href: "/design" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const headerBg =
    isScrolled || isMobileMenuOpen
      ? "bg-[#080808]/95 backdrop-blur-xl border-b border-gold/10"
      : "bg-transparent";

  return (
    <>
      {/* ─── Header Bar ───────────────────────────────────────── */}
      <header
        className={`fixed top-0 right-0 left-0 z-[100] isolate transition-all duration-500 ease-out ${headerBg}`}
      >
        <div className="container-wusha">
          <div className="flex items-center justify-between h-16 sm:h-[72px] min-h-[64px]">
            {/* Logo — دائماً ظاهر وواضح */}
            <div className="relative z-[110] flex-shrink-0">
              <Logo size="sm" className="block" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 flex-1">
              {navItems.map((item, index) => (
                <Link key={item.href} href={item.href} className="group">
                  <motion.span
                    className="relative inline-block text-white/70 group-hover:text-gold transition-colors duration-300 text-sm font-medium py-2"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08 + 0.2 }}
                    whileHover={{ y: -1 }}
                  >
                    {item.label}
                    <span className="absolute bottom-0 right-0 left-0 h-px bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </motion.span>
                </Link>
              ))}
            </nav>

            {/* Desktop: Search + Auth */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <Link href="/search" aria-label="البحث">
                <motion.div
                  className="p-2.5 rounded-xl text-white/60 hover:text-gold hover:bg-white/5 transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Search className="w-5 h-5" />
                </motion.div>
              </Link>

              <SignedIn>
                <div className="flex items-center gap-3">
                  <Link href="/account">
                    <motion.button
                      className="btn-gold text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <User className="w-4 h-4" />
                      حسابي
                    </motion.button>
                  </Link>
                  <div className="[&_.cl-userButtonBox]:flex [&_.cl-userButtonTrigger]:rounded-xl">
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: "w-10 h-10 border-2 border-gold/30 hover:border-gold transition-colors duration-300",
                        },
                      }}
                    />
                  </div>
                </div>
              </SignedIn>
              <SignedOut>
                <Link href="/sign-in">
                  <motion.button
                    className="btn-gold text-sm py-2.5 px-5 flex items-center gap-2 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <User className="w-4 h-4" />
                    تسجيل الدخول
                  </motion.button>
                </Link>
              </SignedOut>
            </div>

            {/* Mobile: Search + Menu Toggle */}
            <div className="flex md:hidden items-center gap-0.5">
              <Link href="/search" aria-label="البحث">
                <span className="p-3 text-white/80 hover:text-gold transition-colors inline-block">
                  <Search className="w-5 h-5" />
                </span>
              </Link>
              <button
                className="relative z-[110] p-3 -mr-1 text-white/90 hover:text-gold transition-colors rounded-xl hover:bg-white/5"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Menu Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-[90] md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-[#080808]/90 backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Menu Content — تحت الهيدر */}
            <motion.div
              className="relative flex flex-col items-center justify-center min-h-full pt-20 pb-12 px-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 + 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="block text-2xl sm:text-3xl font-bold text-white/85 hover:text-gold transition-colors py-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              <SignedIn>
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link
                    href="/account"
                    className="flex items-center gap-3 text-2xl sm:text-3xl font-bold text-white/85 hover:text-gold transition-colors py-4"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-6 h-6" />
                    حسابي
                  </Link>
                </motion.div>

                <motion.div
                  className="flex flex-col items-center gap-4 mt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-12 h-12 border-2 border-gold/30",
                      },
                    }}
                  />
                </motion.div>
              </SignedIn>
              <SignedOut>
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="btn-gold flex items-center gap-2 cursor-pointer py-3 px-6">
                      <User className="w-5 h-5" />
                      تسجيل الدخول
                    </button>
                  </Link>
                </motion.div>
              </SignedOut>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
