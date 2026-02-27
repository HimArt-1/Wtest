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
            <div className="pt-16 sm:pt-[72px]">
                {children}
            </div>
            <Footer />
        </>
    );
}
