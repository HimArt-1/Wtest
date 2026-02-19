# إعداد Supabase Storage لـ bucket «designs»

يُستخدم الـ bucket `designs` لحفظ صور التصاميم المؤقتة عند توليد تصميم «من صورة» (رفع الصورة لـ Replicate). اتبع أحد الطريقتين.

---

## كيف يعمل الـ bucket «designs»؟

### متى يُستخدم؟

- عند اختيار المستخدم **«من صورة»** في صفحة «تصميم قطعة» ورفع صورة مرجعية.
- الهدف: إرسال هذه الصورة إلى **Replicate** (نموذج صورة→صورة مثل `flux_img2img`) ليولّد تصميماً جديداً بناءً عليها.

### لماذا نحتاج الـ bucket؟

- واجهة Replicate تقبل إما **رابط URL** للصورة أو **data URL** (سلسلة base64).
- إذا كانت الصورة كبيرة (أكبر من ~250 KB)، إرسالها كـ base64 في الطلب غير عملي أو قد يفشل.
- الحل: رفع الصورة أولاً إلى **Supabase Storage**، ثم إرسال **الرابط العام** لهذه الصورة إلى Replicate؛ Replicate يحمّل الصورة من الرابط ويستخدمها في النموذج.

### مسار التنفيذ (من الكود)

1. المستخدم يرفع صورة في الواجهة → تُحوَّل إلى **base64** وتُرسل مع الطلب إلى Server Action `generateDesignForPrint`.
2. في `ai.ts`:
   - إذا كان **الحجم &gt; 250 KB** → نستدعي `uploadImageToStorage(base64)`:
     - فكّ الـ base64 إلى ملف ثنائي (Buffer).
     - رفع الملف إلى الـ bucket `designs` في المسار:  
       `temp/{timestamp}-{random}.{jpg|png|...}`
     - الحصول على **رابط عام** للصورة عبر `getPublicUrl(...)`.
     - هذا الرابط يُعاد ويُخزَّن في المتغير `imageInput`.
   - إذا كان الحجم **صغيراً** → نستخدم الـ base64 مباشرة كـ `imageInput` (لا رفع).
3. إن وُجدت `imageInput` (رابط أو base64) → نستدعي Replicate بنموذج **صورة→صورة** (`flux_img2img`) مع `prompt` + `image`.
4. النتيجة من Replicate هي **رابط صورة التصميم الجديد** (لا يُخزَّن في `designs`؛ يُعرض للمستخدم ويُستخدم في المعاينة).

### ملخص

| العنصر | الوصف |
|--------|--------|
| **محتوى الـ bucket** | صور مرجعية مؤقتة يرفعها السيرفر قبل إرسالها لـ Replicate (مجلد `temp/`). |
| **من يرفع** | السيرفر فقط (عبر Service Role)، وليس المستخدم مباشرة من المتصفح. |
| **الرابط العام** | مطلوب حتى يستطيع Replicate تحميل الصورة من الرابط. |
| **حذف الملفات** | الملفات مؤقتة؛ يمكن لاحقاً إضافة مهمة (Cron) لحذف ملفات `temp/` الأقدم من ساعة/يوم إن رغبت. |

---

## الطريقة 1: من لوحة Supabase (Dashboard)

1. ادخل إلى [app.supabase.com](https://app.supabase.com) وافتح مشروعك.
2. من القائمة الجانبية اختر **Storage**.
3. اضغط **New bucket**.
4. أدخل:
   - **Name:** `designs`
   - **Public bucket:** فعّل (مفعّل) حتى يمكن الحصول على رابط عام للصورة وإرساله لـ Replicate.
5. اضغط **Create bucket**.
6. بعد الإنشاء، اضغط على الـ bucket `designs` ثم **Policies** (أو من Storage → Configuration):
   - أضف سياسة **SELECT (قراءة)** للجميع حتى تكون الملفات قابلة للوصول عبر الرابط العام.
   - في Supabase الجديد: الـ bucket العام يسمح بالقراءة تلقائياً غالباً. إن لم يظهر الرابط بشكل صحيح، أضف Policy:
     - Policy name: `Public read designs`
     - Allowed operation: **SELECT**
     - Target: `bucket_id = 'designs'`

لا تحتاج سياسة **INSERT** للمستخدمين إن كان الرفع يتم من السيرفر فقط (عبر Service Role)، لأن مفتاح Service Role يتجاوز RLS.

---

## الطريقة 2: تشغيل الـ migration (من المشروع)

إذا كنت تستخدم Supabase CLI ومشروعاً مرتبطاً:

```bash
npx supabase db push
# أو
npx supabase migration up
```

أو نفّذ محتوى الملف يدوياً في **SQL Editor** في لوحة Supabase:

- الملف: `supabase/migrations/20250126000000_create_designs_bucket.sql`

ينشئ الـ migration الـ bucket `designs` كـ public ويضيف سياسة القراءة العامة.

---

## متغيرات البيئة المطلوبة

في `.env.local` (أو بيئة الإنتاج):

```env
# Replicate (توليد التصاميم)
REPLICATE_API_TOKEN=r8_xxxx

# Supabase (للرفع المؤقت لصور التصاميم)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # مطلوب لرفع الصور من السيرفر إلى designs
```

- **REPLICATE_API_TOKEN:** من [replicate.com/account](https://replicate.com/account).
- **SUPABASE_SERVICE_ROLE_KEY:** من Supabase → Project Settings → API → `service_role` (سري، لا تشاركه في الواجهة).

---

## التحقق

بعد إنشاء الـ bucket وإعداد المفاتيح:

1. ادخل إلى صفحة «تصميم قطعة» واختر «من صورة» ثم ارفع صورة واكتب وصفاً.
2. اضغط توليد التصميم. إن كان الرفع يعمل، ستُستخدم الصورة في نموذج صورة→صورة (Replicate) ولن يظهر خطأ تخزين.

إذا ظهر خطأ مثل "new row violates row-level security policy"، تأكد من وجود `SUPABASE_SERVICE_ROLE_KEY` وأن الـ bucket `designs` موجود واسمه بالضبط `designs`.
