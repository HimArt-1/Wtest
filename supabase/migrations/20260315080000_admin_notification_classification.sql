-- Add category/severity metadata to admin notifications.

ALTER TABLE public.admin_notifications
    ADD COLUMN IF NOT EXISTS category TEXT;

ALTER TABLE public.admin_notifications
    ADD COLUMN IF NOT EXISTS severity TEXT;

UPDATE public.admin_notifications
SET
    category = CASE
        WHEN type IN ('order_new', 'order_status', 'order_update', 'order_alert') THEN 'orders'
        WHEN type = 'payment_received' THEN 'payments'
        WHEN type = 'application_new' THEN 'applications'
        WHEN type = 'system_alert' THEN 'system'
        ELSE 'system'
    END,
    severity = CASE
        WHEN type = 'payment_received' THEN 'info'
        WHEN type = 'application_new' THEN 'info'
        WHEN type = 'system_alert' THEN 'warning'
        WHEN type IN ('order_alert', 'order_status') THEN 'warning'
        ELSE 'info'
    END
WHERE category IS NULL OR severity IS NULL;

ALTER TABLE public.admin_notifications
    ALTER COLUMN category SET DEFAULT 'system';

ALTER TABLE public.admin_notifications
    ALTER COLUMN severity SET DEFAULT 'info';

ALTER TABLE public.admin_notifications
    ALTER COLUMN category SET NOT NULL;

ALTER TABLE public.admin_notifications
    ALTER COLUMN severity SET NOT NULL;

ALTER TABLE public.admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_category_check;

ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_category_check
    CHECK (category IN ('orders', 'payments', 'applications', 'support', 'design', 'system', 'security'));

ALTER TABLE public.admin_notifications
    DROP CONSTRAINT IF EXISTS admin_notifications_severity_check;

ALTER TABLE public.admin_notifications
    ADD CONSTRAINT admin_notifications_severity_check
    CHECK (severity IN ('info', 'warning', 'critical'));

CREATE INDEX IF NOT EXISTS idx_admin_notifications_category_created
ON public.admin_notifications(category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_severity_created
ON public.admin_notifications(severity, created_at DESC);
