"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState } from "react";

interface GalleryFiltersProps {
    categories: any[];
    currentCategory: string;
    currentSearch: string;
}

export function GalleryFilters({ categories, currentCategory, currentSearch }: GalleryFiltersProps) {
    const router = useRouter();
    const [search, setSearch] = useState(currentSearch);

    const navigate = (category: string, searchQuery?: string) => {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (searchQuery) params.set("search", searchQuery);
        router.push(`/gallery?${params.toString()}`);
    };

    return (
        <div className="mb-8 space-y-4">
            {/* Search */}
            <div className="relative max-w-md mx-auto">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-fg/20" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && navigate(currentCategory, search)}
                    placeholder="ابحث في المعرض..."
                    className="w-full h-11 bg-surface/60 border border-white/[0.06] rounded-xl pr-11 pl-10 text-sm text-fg placeholder:text-fg/20 focus:outline-none focus:border-gold/30"
                />
                {search && (
                    <button
                        onClick={() => { setSearch(""); navigate(currentCategory, ""); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-fg/20 hover:text-fg/50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => navigate("all", search)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${currentCategory === "all"
                            ? "bg-gold/10 text-gold border border-gold/30"
                            : "text-fg/30 hover:bg-white/[0.03] border border-transparent"
                        }`}
                >
                    الكل
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.slug}
                        onClick={() => navigate(cat.slug, search)}
                        className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${currentCategory === cat.slug
                                ? "bg-gold/10 text-gold border border-gold/30"
                                : "text-fg/30 hover:bg-white/[0.03] border border-transparent"
                            }`}
                    >
                        {cat.name_ar}
                    </button>
                ))}
            </div>
        </div>
    );
}
