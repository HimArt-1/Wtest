import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartSheet } from "@/components/store/CartSheet";
import { ensureProfile } from "@/lib/ensure-profile";

export default async function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    await ensureProfile();

    return (
        <>
            <Header />
            <CartSheet />
            <div className="relative">
                <div className="absolute inset-0 pointer-events-none cyber-grid opacity-25" aria-hidden />
                <div className="relative z-10">
                    {children}
                </div>
            </div>
            <Footer />
        </>
    );
}
