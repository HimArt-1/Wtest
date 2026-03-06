-- ═══════════════════════════════════════════════════════════
-- وشّى | WUSHA — Inventory, SKUs & Sales (ERP Module)
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Product SKUs (Barcodes) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.product_skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    size TEXT,
    color_code TEXT,
    barcode_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_skus_product_id ON public.product_skus(product_id);
CREATE INDEX IF NOT EXISTS idx_product_skus_sku ON public.product_skus(sku);

ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for product_skus" ON public.product_skus FOR SELECT USING (true);
CREATE POLICY "Admin full access for product_skus" ON public.product_skus USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);

-- ─── 2. Warehouses ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default main warehouse
INSERT INTO public.warehouses (name, location) VALUES ('المستودع الرئيسي', 'الرياض') ON CONFLICT DO NOTHING;

ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin read access for warehouses" ON public.warehouses FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);
CREATE POLICY "Admin full access for warehouses" ON public.warehouses USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);

-- ─── 3. Inventory Levels ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID NOT NULL REFERENCES public.product_skus(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sku_id, warehouse_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_levels_sku_id ON public.inventory_levels(sku_id);

ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for inventory_levels" ON public.inventory_levels FOR SELECT USING (true); -- needed for storefront stock checks
CREATE POLICY "Admin full access for inventory_levels" ON public.inventory_levels USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);

-- ─── 4. Inventory Transactions (Audit Log) ─────────────────
CREATE TYPE inventory_transaction_type AS ENUM ('addition', 'sale', 'adjustment', 'transfer', 'return');

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id UUID NOT NULL REFERENCES public.product_skus(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
    transaction_type inventory_transaction_type NOT NULL,
    quantity_change INTEGER NOT NULL, -- positive for addition/returns, negative for sales/deductions
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_id UUID, -- Optional: links to order_id or sales_record_id
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_sku_id ON public.inventory_transactions(sku_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at ON public.inventory_transactions(created_at);

ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access for inventory_transactions" ON public.inventory_transactions USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);

-- ─── 5. Sales Records (Ledger / POS) ───────────────────────
CREATE TYPE sales_method_type AS ENUM ('online_store', 'booth_manual', 'custom_design');

CREATE TABLE IF NOT EXISTS public.sales_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sales_method sales_method_type NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL, -- Null if booth sale without order record
    sku_id UUID REFERENCES public.product_skus(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'refunded'
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Clerk ID or Profile ID of the admin who made the manual sale
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_records_method ON public.sales_records(sales_method);
CREATE INDEX IF NOT EXISTS idx_sales_records_created_at ON public.sales_records(created_at);

ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access for sales_records" ON public.sales_records USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.clerk_id = auth.uid()::text AND profiles.role = 'admin')
);

-- ─── 6. Database Triggers for Updated At ───────────────────
CREATE TRIGGER update_product_skus_modtime
    BEFORE UPDATE ON public.product_skus
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_warehouses_modtime
    BEFORE UPDATE ON public.warehouses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_levels_modtime
    BEFORE UPDATE ON public.inventory_levels
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_records_modtime
    BEFORE UPDATE ON public.sales_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
