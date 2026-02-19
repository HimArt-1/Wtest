// ═══════════════════════════════════════════════════════════
//  وشّى | WUSHA — تصميم قطعة
//  ثوابت وأنواع مسار "تصميم قطعة واحدة"
// ═══════════════════════════════════════════════════════════

// ─── القطع (الملابس) ─────────────────────────────────────

export const GARMENTS = [
  {
    id: "tshirt",
    label: "تيشيرت",
    labelEn: "T-Shirt",
    slug: "tshirt",
    description: "قطعة كلاسيكية مناسبة لأي تصميم",
    icon: "👕",
    mockupAspect: 0.8,
    mockupSrc: "/mockups/tshirt.svg",
  },
  {
    id: "hoodie",
    label: "هودي",
    labelEn: "Hoodie",
    slug: "hoodie",
    description: "دفء وأناقة مع مساحة طباعة واسعة",
    icon: "🧥",
    mockupAspect: 0.85,
    mockupSrc: "/mockups/hoodie.svg",
  },
  {
    id: "sweatshirt",
    label: "سويت تيشيرت",
    labelEn: "Sweatshirt",
    slug: "sweatshirt",
    description: "راحة مع مساحة ظهر مميزة",
    icon: "👔",
    mockupAspect: 0.82,
    mockupSrc: "/mockups/sweatshirt.svg",
  },
] as const;

export type GarmentId = (typeof GARMENTS)[number]["id"];

// ─── مواضع الطباعة ──────────────────────────────────────

export const PRINT_POSITIONS = [
  {
    id: "chest",
    label: "صدر",
    labelEn: "Chest",
    slug: "chest",
    description: "المنطقة الأمامية الوسطى",
    area: { width: 0.35, height: 0.4, top: 0.22, left: 0.325 },
  },
  {
    id: "back",
    label: "ظهر",
    labelEn: "Back",
    slug: "back",
    description: "منطقة الظهر الكاملة",
    area: { width: 0.7, height: 0.5, top: 0.2, left: 0.15 },
  },
  {
    id: "shoulder_right",
    label: "كتف يمين",
    labelEn: "Right Shoulder",
    slug: "shoulder_right",
    description: "الكتف الأيمن",
    area: { width: 0.25, height: 0.2, top: 0.15, left: 0.1 },
  },
  {
    id: "shoulder_left",
    label: "كتف يسار",
    labelEn: "Left Shoulder",
    slug: "shoulder_left",
    description: "الكتف الأيسر",
    area: { width: 0.25, height: 0.2, top: 0.15, left: 0.65 },
  },
] as const;

export type PrintPositionId = (typeof PRINT_POSITIONS)[number]["id"];

// ─── طريقة التصميم ───────────────────────────────────────

export const DESIGN_METHODS = [
  { id: "from_image", label: "تصميم من صورة", labelEn: "From Image", icon: "🖼️", description: "ارفع صورة أو التقطها واكتب فكرتك" },
  { id: "from_text", label: "تصميم من نص", labelEn: "From Text", icon: "✍️", description: "صف التصميم بالكلمات ونولّده لك" },
] as const;

export type DesignMethodId = (typeof DESIGN_METHODS)[number]["id"];

// ─── الأنماط (للـ AI) ────────────────────────────────────

export const DESIGN_STYLES = [
  { id: "arabic_calligraphy", label: "خط عربي", prompt: "Arabic calligraphy, elegant script, traditional" },
  { id: "heritage", label: "تراثي", prompt: "Heritage style, Saudi Arabian traditional patterns, ornate" },
  { id: "geometric_islamic", label: "هندسي إسلامي", prompt: "Islamic geometric patterns, tessellation, symmetry" },
  { id: "abstract", label: "تجريدي", prompt: "Abstract art, modern, bold shapes and colors" },
  { id: "realistic", label: "واقعي", prompt: "Realistic, detailed, high quality illustration" },
  { id: "cartoon", label: "كارتون", prompt: "Cartoon style, playful, clean lines" },
  { id: "minimal", label: "بسيط", prompt: "Minimalist design, clean, few elements" },
  { id: "nature", label: "طبيعة", prompt: "Nature inspired, landscapes, organic forms" },
  { id: "portrait_art", label: "بورتريه فني", prompt: "Artistic portrait, stylized, expressive" },
  { id: "wusha_special", label: "نمط وشّى", prompt: "Wusha brand style, heritage meets modern, gold and earth tones" },
] as const;

export type DesignStyleId = (typeof DESIGN_STYLES)[number]["id"];

// ─── الألوان (باليت ثابتة) ────────────────────────────────

export const DESIGN_COLORS = [
  { id: "gold", hex: "#ceae7f", label: "ذهبي" },
  { id: "ink", hex: "#1f1913", label: "حبر" },
  { id: "forest", hex: "#1a513c", label: "أخضر غابة" },
  { id: "mist", hex: "#9D8BB1", label: "بنفسجي" },
  { id: "earth", hex: "#5A3E2B", label: "بني" },
  { id: "white", hex: "#ffffff", label: "أبيض" },
  { id: "black", hex: "#000000", label: "أسود" },
  { id: "sand", hex: "#EBE5D9", label: "رمل" },
  { id: "coral", hex: "#c46b5c", label: "مرجاني" },
  { id: "navy", hex: "#2c3e50", label: "أزرق داكن" },
] as const;

export type DesignColorId = (typeof DESIGN_COLORS)[number]["id"];

// ─── حالة المعالج ────────────────────────────────────────

export interface DesignPieceState {
  step: number;
  garment: GarmentId | null;
  position: PrintPositionId | null;
  method: DesignMethodId | null;
  // من صورة
  imageFile: File | null;
  imagePreviewUrl: string | null;
  ideaText: string;
  // من نص
  textPrompt: string;
  // مشترك
  styleId: DesignStyleId | null;
  colorIds: DesignColorId[];
  // نتيجة
  generatedImageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
}

export const INITIAL_DESIGN_STATE: DesignPieceState = {
  step: 1,
  garment: null,
  position: null,
  method: null,
  imageFile: null,
  imagePreviewUrl: null,
  ideaText: "",
  textPrompt: "",
  styleId: null,
  colorIds: [],
  generatedImageUrl: null,
  isGenerating: false,
  error: null,
};

// عدد الخطوات الإجمالي (1 قطعة، 2 موضع، 3 طريقة، 4 إدخال، 5 نتيجة)
export const DESIGN_PIECE_STEPS_COUNT = 5;
