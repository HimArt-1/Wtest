-- ═══════════════════════════════════════════════════════════
--  وشّى | WUSHA — Design Order Fulfillment
--  إرسال طلب التصميم كمنتج جاهز للسلة
-- ═══════════════════════════════════════════════════════════

ALTER TABLE public.custom_design_orders 
ADD COLUMN IF NOT EXISTS final_price DECIMAL(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_sent_to_customer BOOLEAN DEFAULT FALSE;
