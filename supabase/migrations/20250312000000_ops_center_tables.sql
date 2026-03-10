-- Migration: مركز الدعم الفني — سجل الزيارات والأخطاء والنظام
-- واجهة الصيانة والفحص والتحليل والأمان

-- ═══ سجل الزيارات (كل شخص زار الموقع) ═══
CREATE TABLE IF NOT EXISTS public.page_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path TEXT NOT NULL,
    full_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_hash TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS page_visits_created_at_idx ON public.page_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS page_visits_path_idx ON public.page_visits(path);
CREATE INDEX IF NOT EXISTS page_visits_user_id_idx ON public.page_visits(user_id);

ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- فقط المسؤولون يمكنهم القراءة (عبر service role أو سياسة admin)
DROP POLICY IF EXISTS "Admins can view page visits" ON public.page_visits;
CREATE POLICY "Admins can view page visits" ON public.page_visits FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'admin'
    ));

-- الإدراج عبر service role فقط (لا سياسة INSERT للمستخدمين)
-- Service role يتجاوز RLS

-- ═══ سجل الأخطاء والنظام ═══
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'error', 'warning', 'info', 'security'
    source TEXT,
    message TEXT NOT NULL,
    stack TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS system_logs_type_idx ON public.system_logs(type);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins can view system logs" ON public.system_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub') AND role = 'admin'
    ));
