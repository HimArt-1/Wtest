-- Creating discount_coupons table
CREATE TABLE IF NOT EXISTS public.discount_coupons (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),
    is_active BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT 0, -- 0 means unlimited
    current_uses INTEGER DEFAULT 0,
    valid_until TIMESTAMP WITH TIME ZONE,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- Only Admins can manage coupons
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discount_coupons' AND policyname = 'Admins can manage coupons'
    ) THEN
        CREATE POLICY "Admins can manage coupons" 
            ON public.discount_coupons 
            FOR ALL 
            USING (
                auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin')
            );
    END IF;
END
$$;

-- Anyone can read active coupons to validate at checkout (Read-Only)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'discount_coupons' AND policyname = 'Anyone can read active coupons'
    ) THEN
        CREATE POLICY "Anyone can read active coupons" 
            ON public.discount_coupons 
            FOR SELECT 
            USING (is_active = true);
    END IF;
END
$$;

-- Indexes for fast lookup during checkout
CREATE INDEX IF NOT EXISTS idx_discount_coupons_code ON public.discount_coupons(code);
CREATE INDEX IF NOT EXISTS idx_discount_coupons_active ON public.discount_coupons(is_active);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS handle_updated_at_coupons ON public.discount_coupons;
CREATE TRIGGER handle_updated_at_coupons
    BEFORE UPDATE ON public.discount_coupons
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Altering public.orders to store coupon data
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='coupon_id') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.discount_coupons(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='discount_amount') THEN
        ALTER TABLE public.orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;
