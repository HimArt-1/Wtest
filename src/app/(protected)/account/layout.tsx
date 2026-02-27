import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight } from "lucide-react";

export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-bg" dir="rtl">
            {/* شريط علوي بسيط — حسابي فقط */}
            <header className="sticky top-0 z-50 bg-bg/95 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Logo size="sm" />
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-fg/50 hover:text-gold transition-colors"
                    >
                        <span>العودة للموقع</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </header>
            {children}
        </div>
    );
}
