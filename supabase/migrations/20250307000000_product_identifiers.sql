-- ═══════════════════════════════════════════════════════════
--  وشّى | WASHA — Product Identifiers System
--  معرفات فريدة قابلة للتخصيص لكل منتج و SKU
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Product Code (معرف المنتج) ─────────────────────────
-- معرف فريد وقابل للقراءة لكل منتج عند الإصدار
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS product_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code) WHERE product_code IS NOT NULL;

-- ─── 2. Sequences (تسلسلات ذرية) ─────────────────────────
-- تسلسل معرفات المنتجات
CREATE SEQUENCE IF NOT EXISTS product_code_seq START 1;

-- تسلسل رموز SKU (لضمان عدم التكرار)
CREATE SEQUENCE IF NOT EXISTS sku_seq START 1;

-- ─── 3. Settings for Templates ───────────────────────────
-- قالب معرف المنتج: {PREFIX}-{SEQ:5} مثال: WSH-00001
-- قالب SKU: {PREFIX}-{TYPE}-{SEQ:5}-{SIZE}-{COLOR} مثال: WSH-P-00001-NA-NA
INSERT INTO site_settings (key, value) VALUES
  ('product_identifiers', '{
    "product_code_template": "{PREFIX}-{SEQ:5}",
    "sku_template": "{PREFIX}-{TYPE}-{SEQ:5}-{SIZE}-{COLOR}",
    "prefix": "WSH",
    "type_map": {"print": "P", "apparel": "T", "digital": "D", "nft": "N", "original": "O"},
    "default_size": "NA",
    "default_color": "NA"
  }'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ─── 4. Function: Generate Product Code ───────────────────
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
  prefix_val TEXT;
  template_val TEXT;
  result TEXT;
BEGIN
  SELECT value->>'prefix', value->>'product_code_template'
  INTO prefix_val, template_val
  FROM site_settings WHERE key = 'product_identifiers'
  LIMIT 1;

  prefix_val := COALESCE(prefix_val, 'WSH');
  template_val := COALESCE(template_val, '{PREFIX}-{SEQ:5}');

  next_val := nextval('product_code_seq');
  result := prefix_val || '-' || lpad(next_val::TEXT, 5, '0');
  RETURN result;
END;
$$;

-- ─── 5. Function: Generate SKU ────────────────────────────
CREATE OR REPLACE FUNCTION generate_sku(
  p_product_type TEXT,
  p_size TEXT DEFAULT NULL,
  p_color TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
  prefix_val TEXT;
  template_val TEXT;
  type_map JSONB;
  type_char TEXT;
  size_val TEXT;
  color_val TEXT;
  result TEXT;
BEGIN
  SELECT value->>'prefix', value->>'sku_template', value->'type_map'
  INTO prefix_val, template_val, type_map
  FROM site_settings WHERE key = 'product_identifiers'
  LIMIT 1;

  prefix_val := COALESCE(prefix_val, 'WSH');
  template_val := COALESCE(template_val, '{PREFIX}-{TYPE}-{SEQ:5}-{SIZE}-{COLOR}');
  type_map := COALESCE(type_map, '{"print":"P","apparel":"T","digital":"D","nft":"N","original":"O"}'::jsonb);

  type_char := COALESCE(type_map->>p_product_type, 'O');
  size_val := UPPER(COALESCE(NULLIF(TRIM(p_size), ''), 'NA'));
  color_val := LOWER(COALESCE(NULLIF(TRIM(p_color), ''), 'NA'));

  -- Replace spaces in size/color
  size_val := REPLACE(size_val, ' ', '');
  color_val := REPLACE(color_val, ' ', '');

  next_val := nextval('sku_seq');
  result := prefix_val || '-' || type_char || '-' || lpad(next_val::TEXT, 5, '0') || '-' || size_val || '-' || color_val;
  RETURN result;
END;
$$;

-- ─── 6. Trigger: Auto-assign product_code on INSERT ───────
CREATE OR REPLACE FUNCTION set_product_code_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.product_code IS NULL THEN
    NEW.product_code := generate_product_code();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_product_code ON public.products;
CREATE TRIGGER trg_set_product_code
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_code_on_insert();

-- ─── 7. Backfill: Assign product_code to existing products ─
DO $$
DECLARE
  r RECORD;
  cnt INT := 0;
BEGIN
  FOR r IN SELECT id FROM products WHERE product_code IS NULL ORDER BY created_at
  LOOP
    UPDATE products SET product_code = generate_product_code() WHERE id = r.id;
    cnt := cnt + 1;
  END LOOP;
  IF cnt > 0 THEN
    RAISE NOTICE 'Backfilled % products with product_code', cnt;
  END IF;
END;
$$;

-- ─── 8. Set SKU sequence to avoid collision with existing SKUs ─
-- (product_code_seq is already correct after backfill)
DO $$
DECLARE
  sku_count INT;
BEGIN
  SELECT COUNT(*) INTO sku_count FROM product_skus;
  IF sku_count > 0 THEN
    PERFORM setval('sku_seq', GREATEST(10000, sku_count * 2));
  END IF;
END;
$$;
