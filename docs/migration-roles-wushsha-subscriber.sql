-- ═══════════════════════════════════════════════════════════
--  وشّى | ترحيل الأدوار: فنان→وشّاي، مشتري→مشترك
--  نفّذ هذا الملف في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1) إزالة قيد الأدوار القديم (يجب قبل التحديث)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- 2) إضافة عمود المستوى للوشّاي (إن لم يكن موجوداً)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS wushsha_level smallint DEFAULT 1;

-- 3) ترحيل الأدوار
UPDATE profiles SET role = 'wushsha', wushsha_level = 1 WHERE role = 'artist';
UPDATE profiles SET role = 'subscriber' WHERE role = 'buyer';

-- 4) إضافة قيد الأدوار الجديد
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'wushsha', 'subscriber', 'guest'));
