-- Idempotent dispatch tracking for emails, pushes, and notifications.

CREATE TABLE IF NOT EXISTS public.event_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_key TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    attempt_count INTEGER NOT NULL DEFAULT 1,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_error TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT event_dispatches_status_check CHECK (status IN ('processing', 'sent', 'failed'))
);

CREATE INDEX IF NOT EXISTS event_dispatches_resource_idx
ON public.event_dispatches(resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS event_dispatches_status_idx
ON public.event_dispatches(status, updated_at DESC);

ALTER TABLE public.event_dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view event dispatches" ON public.event_dispatches;
CREATE POLICY "Admins can view event dispatches" ON public.event_dispatches FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND p.role = 'admin'
        )
    );
