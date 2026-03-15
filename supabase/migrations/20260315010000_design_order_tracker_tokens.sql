-- ═══════════════════════════════════════════════════════════
--  وشّى | WASHA — Design Order Tracker Tokens
--  Add per-order access tokens and retire broad public RLS
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.custom_design_orders
ADD COLUMN IF NOT EXISTS tracker_token UUID DEFAULT gen_random_uuid();

UPDATE public.custom_design_orders
SET tracker_token = gen_random_uuid()
WHERE tracker_token IS NULL;

ALTER TABLE public.custom_design_orders
ALTER COLUMN tracker_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_design_orders_tracker_token
ON public.custom_design_orders(tracker_token);

DROP POLICY IF EXISTS "Anyone can read design orders" ON public.custom_design_orders;
DROP POLICY IF EXISTS "Anyone can update own design orders" ON public.custom_design_orders;

DROP POLICY IF EXISTS "Anyone can read messages" ON public.design_order_messages;
DROP POLICY IF EXISTS "Anyone can insert a message" ON public.design_order_messages;
