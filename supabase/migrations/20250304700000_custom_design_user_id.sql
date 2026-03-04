-- MIGRATION: 20250304700000_custom_design_user_id.sql

-- Add user_id column to custom_design_orders
ALTER TABLE public.custom_design_orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Enable RLS if not already enabled
ALTER TABLE public.custom_design_orders ENABLE ROW LEVEL SECURITY;

-- Add index for user_id to make fetching user orders fast
CREATE INDEX IF NOT EXISTS idx_custom_design_orders_user_id ON public.custom_design_orders(user_id);

-- Update RLS policies to allow users to read their own orders
-- (Assuming there might be policies already, we add one specifically for authenticated users)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'custom_design_orders' AND policyname = 'Users can view their own design orders'
    ) THEN
        DROP POLICY IF EXISTS "Users can view their own design orders" ON public.custom_design_orders;
        CREATE POLICY "Users can view their own design orders" ON public.custom_design_orders
            FOR SELECT USING ((current_setting('request.jwt.claims', true)::json->>'sub') = (SELECT clerk_id FROM public.profiles WHERE id = user_id LIMIT 1));
    END IF;
END $$;
