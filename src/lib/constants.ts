// ═══════════════════════════════════════════════════════════
//  وشّى | WASHA — Constants
//  ثوابت التطبيق المشتركة
// ═══════════════════════════════════════════════════════════

// ─── Navigation ──────────────────────────────────────────

export const NAV_ITEMS = [
    { label: "المعرض", href: "#gallery" },
    { label: "المتجر", href: "#store" },
    { label: "انضم إلينا", href: "#join" },
] as const;

// ─── Categories ──────────────────────────────────────────

export const ART_CATEGORIES = [
    { id: "all", name_ar: "الكل", name_en: "All" },
    { id: "digital", name_ar: "رقمي", name_en: "Digital" },
    { id: "photography", name_ar: "تصوير", name_en: "Photography" },
    { id: "calligraphy", name_ar: "خط", name_en: "Calligraphy" },
    { id: "traditional", name_ar: "تقليدي", name_en: "Traditional" },
    { id: "abstract", name_ar: "تجريدي", name_en: "Abstract" },
] as const;

// ─── Product Types ───────────────────────────────────────

export const PRODUCT_TYPES = {
    print: "طباعة قماشية",
    apparel: "ملابس",
    digital: "رقمي",
    nft: "NFT",
    original: "أصلي",
} as const;

// ─── Apparel Sizes ───────────────────────────────────────

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

// ─── Currencies ──────────────────────────────────────────

export const CURRENCIES = {
    SAR: { symbol: "ر.س", name: "ريال سعودي" },
    USD: { symbol: "$", name: "دولار أمريكي" },
    ETH: { symbol: "ETH", name: "إيثريوم" },
} as const;

// ─── Application Steps ──────────────────────────────────

export const APPLICATION_STEPS = [
    "أرسل أعمالك",
    "مراجعة الفريق",
    "القبول والانطلاق",
] as const;

// ─── Limits ──────────────────────────────────────────────

export const LIMITS = {
    MAX_UPLOAD_SIZE_MB: 10,
    MAX_IMAGES_PER_ARTWORK: 5,
    MAX_TAGS_PER_ARTWORK: 10,
    MAX_PORTFOLIO_IMAGES: 10,
    ARTWORKS_PER_PAGE: 12,
    PRODUCTS_PER_PAGE: 12,
    ORDERS_PER_PAGE: 20,
} as const;

// ─── Supabase Storage Buckets ────────────────────────────

export const STORAGE_BUCKETS = {
    ARTWORKS: "artworks",
    AVATARS: "avatars",
    COVERS: "covers",
    PRODUCTS: "products",
    PORTFOLIO: "portfolio",
} as const;
