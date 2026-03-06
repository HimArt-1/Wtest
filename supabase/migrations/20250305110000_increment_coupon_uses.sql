-- Migration to add atomic coupon usage increment
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.discount_coupons
  SET current_uses = current_uses + 1
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
