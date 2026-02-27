-- ربط الطلبات المقبولة بالملف الشخصي
ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_applications_profile_id ON applications(profile_id);
