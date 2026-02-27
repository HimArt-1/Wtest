// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — مسار التصميم للمستخدم النهائي
//  اختيار قطعة → لون → طريقة تصميم → معاينة → طلب
// ═══════════════════════════════════════════════════════════

// ─── القطع (هودي / بلوفر / تيشيرت) ────────────────────────

export const CREATION_GARMENTS = [
  {
    id: "tshirt",
    label: "تيشيرت",
    icon: "👕",
    mockupSrc: "/mockups/tshirt-front.png",
    mockupFront: "/mockups/tshirt-front.png",
    mockupBack: "/mockups/tshirt-back.png",
  },
  {
    id: "hoodie",
    label: "هودي",
    icon: "🧥",
    mockupSrc: "/mockups/hoodie-front.png",
    mockupFront: "/mockups/hoodie-front.png",
    mockupBack: "/mockups/hoodie-back.png",
  },
  {
    id: "pullover",
    label: "بلوفر",
    icon: "👔",
    mockupSrc: "/mockups/pullover-front.png",
    mockupFront: "/mockups/pullover-front.png",
    mockupBack: "/mockups/pullover-back.png",
  },
] as const;

export type CreationGarmentId = (typeof CREATION_GARMENTS)[number]["id"];

// ─── لوحة الألوان (هوية سعودية معاصرة) ────────────────────

export const CREATION_COLORS = [
  { id: "sand", hex: "#EBE5D9", label: "رمل" },
  { id: "earth", hex: "#5A3E2B", label: "بني عميق" },
  { id: "olive", hex: "#4a5d23", label: "زيتي" },
  { id: "mist", hex: "#9D8BB1", label: "بنفسجي خفيف" },
  { id: "gold", hex: "#ceae7f", label: "ذهبي" },
  { id: "ink", hex: "#1f1913", label: "حبر" },
  { id: "white", hex: "#ffffff", label: "أبيض" },
  { id: "black", hex: "#000000", label: "أسود" },
  { id: "navy", hex: "#2c3e50", label: "أزرق داكن" },
  { id: "coral", hex: "#c46b5c", label: "مرجاني" },
] as const;

export type CreationColorId = (typeof CREATION_COLORS)[number]["id"];

// ─── طرق التصميم (5 خيارات) ───────────────────────────────

export const CREATION_DESIGN_METHODS = [
  {
    id: "ready_text",
    label: "كتابة جاهزة",
    description: "نصوص عربية حديثة جاهزة للطباعة",
    icon: "✍️",
  },
  {
    id: "from_studio",
    label: "من الاستوديو",
    description: "تصاميم فنية من مكتبة وشّى",
    icon: "🎨",
  },
  {
    id: "from_text",
    label: "توليد من نص",
    description: "اكتب وصفاً ونولّد لك التصميم بالذكاء الاصطناعي",
    icon: "✨",
  },
  {
    id: "from_image",
    label: "توليد من صورة",
    description: "ارفع صورة مرجعية ونحوّلها لتصميم فني",
    icon: "🖼️",
  },
  {
    id: "combine",
    label: "دمج عناصر",
    description: "اجمع عناصر وصنع طباعة فريدة",
    icon: "🔀",
  },
] as const;

export type CreationDesignMethodId =
  (typeof CREATION_DESIGN_METHODS)[number]["id"];

// ─── موضع الطباعة (صدر / ظهر) ────────────────────────────

export const CREATION_POSITIONS = [
  { id: "chest", label: "صدر", area: { width: 0.35, height: 0.4, top: 0.22, left: 0.325 } },
  { id: "back", label: "ظهر", area: { width: 0.7, height: 0.5, top: 0.2, left: 0.15 } },
] as const;

export type CreationPositionId = (typeof CREATION_POSITIONS)[number]["id"];

// ─── نصوص جاهزة (كتابة عربية حديثة) ───────────────────────

export const READY_TEXTS = [
  { id: "wusha", text: "وشّى", style: "خط عربي عصري" },
  { id: "art", text: "فنٌ يرتدى", style: "تايبوجرافي" },
  { id: "identity", text: "هويتي", style: "بسيط" },
  { id: "dream", text: "حلم", style: "خط عربي" },
  { id: "create", text: "اصنع", style: "تايبوجرافي" },
  { id: "unique", text: "فريد", style: "بسيط" },
  { id: "heritage", text: "تراث", style: "خط عربي" },
  { id: "modern", text: "عصري", style: "تايبوجرافي" },
] as const;

// ─── حالة مسار التصميم ───────────────────────────────────

export interface DesignCreationState {
  step: number;
  garment: CreationGarmentId | null;
  colorId: CreationColorId | null;
  method: CreationDesignMethodId | null;
  position: CreationPositionId | null;
  // ready_text
  readyTextId: string | null;
  // from_studio
  studioDesignId: string | null;
  // from_text
  textPrompt: string;
  // from_image
  ideaText: string;
  styleId: string | null;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  // نتيجة
  designImageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
}

export const INITIAL_CREATION_STATE: DesignCreationState = {
  step: 1,
  garment: null,
  colorId: null,
  method: null,
  position: null,
  readyTextId: null,
  studioDesignId: null,
  textPrompt: "",
  ideaText: "",
  styleId: null,
  imageFile: null,
  imagePreviewUrl: null,
  designImageUrl: null,
  isGenerating: false,
  error: null,
};

export const CREATION_STEPS_COUNT = 5; // 1 قطعة، 2 لون، 3 طريقة، 4 إدخال، 5 معاينة وطلب
