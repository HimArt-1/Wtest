import { Suspense } from "react";
import SearchContent from "./SearchContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "البحث — وشّى",
    description: "ابحث في الأعمال الفنية والمنتجات والفنانين على منصة وشّى",
};

function SearchFallback() {
    return (
        <div className="min-h-screen bg-bg pt-24 pb-20 flex items-center justify-center" dir="rtl">
            <div className="text-center">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                <p className="text-fg/30 text-sm">جاري التحميل...</p>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchFallback />}>
            <SearchContent />
        </Suspense>
    );
}
