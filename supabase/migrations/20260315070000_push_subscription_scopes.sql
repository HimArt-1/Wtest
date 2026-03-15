-- Separate user push subscriptions from admin alert subscriptions.

ALTER TABLE public.push_subscriptions
    ADD COLUMN IF NOT EXISTS scope TEXT;

UPDATE public.push_subscriptions
SET scope = 'user'
WHERE scope IS NULL;

UPDATE public.push_subscriptions ps
SET scope = 'both'
FROM public.profiles p
WHERE ps.user_id = p.id
  AND p.role = 'admin'
  AND ps.scope = 'user';

ALTER TABLE public.push_subscriptions
    ALTER COLUMN scope SET DEFAULT 'user';

ALTER TABLE public.push_subscriptions
    ALTER COLUMN scope SET NOT NULL;

ALTER TABLE public.push_subscriptions
    DROP CONSTRAINT IF EXISTS push_subscriptions_scope_check;

ALTER TABLE public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_scope_check
    CHECK (scope IN ('user', 'admin', 'both'));

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_scope
ON public.push_subscriptions(scope, user_id);
