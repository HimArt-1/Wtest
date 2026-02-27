import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ArrowRight } from "lucide-react";

type Props = { searchParams?: { redirect_url?: string } };

export default function SignInPage({ searchParams }: Props) {
    const redirectUrl = searchParams?.redirect_url?.startsWith("/") ? searchParams.redirect_url : "/account";

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4 py-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-gold/[0.04] rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-gold/[0.02] rounded-full blur-[80px]" />
            </div>

            <div className="relative w-full max-w-md">
                <Link href="/" className="flex justify-center mb-8">
                    <Logo size="md" />
                </Link>

                <div className="rounded-2xl border border-white/[0.06] bg-surface/80 backdrop-blur-xl p-2 shadow-2xl">
                    <SignIn
                        path="/sign-in"
                        fallbackRedirectUrl={redirectUrl}
                        signUpUrl="/sign-up"
                    />
                </div>

                <p className="text-center text-fg/40 text-sm mt-6">
                    ليس لديك حساب؟{" "}
                    <Link
                        href="/sign-up"
                        className="text-gold hover:text-gold/80 font-medium inline-flex items-center gap-1"
                    >
                        إنشاء حساب
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </p>
            </div>
        </div>
    );
}
