-- Restrict public intake tables to server-managed writes.

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can apply" ON public.applications;
DROP POLICY IF EXISTS "Applicants see own" ON public.applications;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;

DROP POLICY IF EXISTS "Push subscriptions readable by service" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Push subscriptions insert" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Push subscriptions delete" ON public.push_subscriptions;

CREATE POLICY "Applicants can view own applications" ON public.applications FOR SELECT
    USING (
        (profile_id IS NOT NULL AND EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = profile_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        ))
        OR lower(email) = lower(coalesce(current_setting('request.jwt.claims', true)::json->>'email', ''))
    );

CREATE POLICY "Admins can manage applications" ON public.applications FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage push subscriptions" ON public.push_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    );
