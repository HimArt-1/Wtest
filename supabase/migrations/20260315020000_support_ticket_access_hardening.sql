-- Tighten support ticket/message access rules.

ALTER TABLE public.support_tickets
    ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.support_tickets
    ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can view and update all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view messages for own tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Users can insert messages to own tickets" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view and insert all messages" ON public.support_messages;

CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can insert own tickets" ON public.support_tickets FOR INSERT
    WITH CHECK (
        user_id IS NOT NULL
        AND EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL
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

CREATE POLICY "Users can view messages for own tickets" ON public.support_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.support_tickets t
            JOIN public.profiles ticket_owner ON ticket_owner.id = t.user_id
            WHERE t.id = ticket_id
              AND ticket_owner.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can insert messages to own tickets" ON public.support_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.support_tickets t
            JOIN public.profiles sender_profile ON sender_profile.id = sender_id
            LEFT JOIN public.profiles ticket_owner ON ticket_owner.id = t.user_id
            WHERE t.id = ticket_id
              AND sender_profile.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              AND (
                  sender_profile.role = 'admin'
                  OR ticket_owner.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
              )
        )
    );

CREATE POLICY "Admins can manage all messages" ON public.support_messages FOR ALL
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
