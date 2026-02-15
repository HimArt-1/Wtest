"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import { Instagram, Twitter, Youtube, Mail, MapPin, Phone, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/app/actions/forms";

const footerLinks = [
  {
    title: "المنصة",
    links: [
      { label: "المعرض", href: "/gallery" },
      { label: "المتجر", href: "/store" },
      { label: "البحث", href: "/search" },
      { label: "انضم إلينا", href: "/#join" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "الأسئلة الشائعة", href: "/#faq" },
      { label: "الشحن والتوصيل", href: "/#shipping" },
      { label: "سياسة الاسترجاع", href: "/#returns" },
      { label: "تواصل معنا", href: "/#contact" },
    ],
  },
  {
    title: "القانونية",
    links: [
      { label: "الشروط والأحكام", href: "/#terms" },
      { label: "سياسة الخصوصية", href: "/#privacy" },
      { label: "حقوق الملكية", href: "/#copyright" },
    ],
  },
];

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "Youtube" },
];

export function Footer() {
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await subscribeNewsletter(formData);
    if (res.success) {
      setSubscribed(true);
    }
    setSubmitting(false);
  };

  return (
    <footer className="bg-[#060606] text-white/80 pt-12 sm:pt-20 pb-6 sm:pb-8 border-t border-gold/10">
      <div className="container-wusha">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12 mb-12 sm:mb-16">
          {/* Brand Column */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2">
            <Logo size="md" className="mb-6" />
            <p className="text-white/40 mb-6 max-w-sm">
              منصة فنية رقمية تجمع المبدعين العرب في مساحة واحدة للعرض، البيع، والاكتشاف.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:hello@wusha.art"
                className="flex items-center gap-3 text-sm text-white/40 hover:text-gold transition-colors"
              >
                <Mail className="w-4 h-4" />
                hello@wusha.art
              </a>
              <a
                href="tel:+966500000000"
                className="flex items-center gap-3 text-sm text-white/40 hover:text-gold transition-colors"
              >
                <Phone className="w-4 h-4" />
                +966 50 000 0000
              </a>
              <div className="flex items-center gap-3 text-sm text-white/40">
                <MapPin className="w-4 h-4" />
                الرياض، المملكة العربية السعودية
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 mt-6">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold hover:text-[#0a0a0a] hover:border-gold transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {footerLinks.map((column) => (
            <div key={column.title}>
              <h4 className="font-bold mb-6 text-white/90">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/40 hover:text-gold transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/5 pt-8 sm:pt-12 mb-8 sm:mb-12">
          <div className="max-w-xl mx-auto text-center">
            <h4 className="text-xl font-bold mb-3 text-white/90">ابقَ على اطلاع</h4>
            <p className="text-sm text-white/40 mb-6">
              اشترك في نشرتنا البريدية لتصلك آخر الأعمال والمعارض
            </p>
            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 text-green-400 p-4 rounded-lg flex items-center justify-center gap-2 border border-green-500/20"
              >
                <Check className="w-5 h-5" />
                شكراً لاشتراكك!
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors text-white/80 placeholder:text-white/20"
                  dir="ltr"
                />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold py-3 px-6 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "اشترك"}
                </motion.button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} وشّى. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-sm text-white/30">
            <span>صُنع بـ</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ❤️
            </motion.span>
            <span>في السعودية</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
