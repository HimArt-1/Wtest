"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Palette, Search, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import {
  SignedIn,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { label: "انضم إلينا", href: "/#join" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <motion.header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-700 ${isScrolled
          ? "bg-[#080808]/80 backdrop-blur-xl border-b border-gold/10"
          : "bg-transparent"
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="container-wusha">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Logo size="sm" />

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item, index) => (
                <Link key={item.href} href={item.href}>
                  <motion.span
                    className="relative text-white/60 hover:text-gold transition-colors duration-300 text-sm font-medium"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ y: -2 }}
                  >
                    {item.label}
                    <motion.span
                      className="absolute -bottom-1 right-0 h-0.5 bg-gold"
                      initial={{ width: 0 }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.span>
                </Link>
              ))}
            </nav>

            {/* Search + Cart + Auth Buttons */}
            <div className="hidden md:flex items-center gap-4">
              {/* Search Icon */}
              <Link href="/search" aria-label="البحث">
                <motion.div
                  className="p-2 text-white/60 hover:text-gold transition-colors duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Search className="w-5 h-5" />
                </motion.div>
              </Link>


              <SignedIn>
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link href="/studio">
                    <motion.button
                      className="btn-gold text-sm py-3 px-6 flex items-center gap-2 cursor-pointer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Palette className="w-4 h-4" />
                      الاستوديو
                    </motion.button>
                  </Link>
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 border-2 border-gold/30 hover:border-gold transition-colors duration-300 ring-2 ring-gold/10",
                      },
                    }}
                  />
                </motion.div>
              </SignedIn>
            </div>

            {/* Mobile: Search + Cart + Menu */}
            <div className="flex md:hidden items-center gap-1">
              <Link href="/search" aria-label="البحث">
                <span className="p-3 text-white/80 inline-block">
                  <Search className="w-5 h-5" />
                </span>
              </Link>
              <button
                className="p-3 -mr-2 text-white/80"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="القائمة"
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
      </motion.header>

      {/* Mobile Menu — Dark Glass */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-[#080808]/95 backdrop-blur-xl md:hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center justify-center h-full gap-6 sm:gap-8 pt-16 sm:pt-20 px-6">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    href={item.href}
                    className="text-2xl sm:text-3xl font-bold text-white/80 hover:text-gold transition-colors py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}

              {/* Mobile: Account Link */}
              <SignedIn>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Link
                    href="/account"
                    className="text-2xl sm:text-3xl font-bold text-white/80 hover:text-gold transition-colors py-2 flex items-center gap-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-6 h-6" />
                    حسابي
                  </Link>
                </motion.div>
              </SignedIn>

              {/* Mobile Auth */}


              <SignedIn>
                <motion.div
                  className="flex flex-col items-center gap-4 mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link
                    href="/studio"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="btn-gold flex items-center gap-2 cursor-pointer">
                      <Palette className="w-5 h-5" />
                      الاستوديو
                    </button>
                  </Link>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
