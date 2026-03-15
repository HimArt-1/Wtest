-- Tighten access for engagement tables and admin-managed mockups.

ALTER TABLE public.artist_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garment_studio_mockups ENABLE ROW LEVEL SECURITY;

-- Social follows
DROP POLICY IF EXISTS "Users can follow artists" ON public.artist_follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.artist_follows;
DROP POLICY IF EXISTS "Anyone can read follows" ON public.artist_follows;
DROP POLICY IF EXISTS "Users can view own follows" ON public.artist_follows;
DROP POLICY IF EXISTS "Users can insert own follows" ON public.artist_follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.artist_follows;
DROP POLICY IF EXISTS "Admins can manage all follows" ON public.artist_follows;

CREATE POLICY "Users can view own follows" ON public.artist_follows FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = follower_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can insert own follows" ON public.artist_follows FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = follower_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can delete own follows" ON public.artist_follows FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = follower_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage all follows" ON public.artist_follows FOR ALL
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

-- Wishlist
DROP POLICY IF EXISTS "Users can add to wishlist" ON public.product_wishlist;
DROP POLICY IF EXISTS "Users can remove from wishlist" ON public.product_wishlist;
DROP POLICY IF EXISTS "Anyone can read wishlist" ON public.product_wishlist;
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.product_wishlist;
DROP POLICY IF EXISTS "Users can insert own wishlist items" ON public.product_wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON public.product_wishlist;
DROP POLICY IF EXISTS "Admins can manage all wishlist items" ON public.product_wishlist;

CREATE POLICY "Users can view own wishlist" ON public.product_wishlist FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can insert own wishlist items" ON public.product_wishlist FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can delete own wishlist items" ON public.product_wishlist FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage all wishlist items" ON public.product_wishlist FOR ALL
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

-- Product likes
DROP POLICY IF EXISTS "Users can like products" ON public.product_likes;
DROP POLICY IF EXISTS "Users can unlike" ON public.product_likes;
DROP POLICY IF EXISTS "Anyone can read likes" ON public.product_likes;
DROP POLICY IF EXISTS "Users can view own likes" ON public.product_likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.product_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.product_likes;
DROP POLICY IF EXISTS "Admins can manage all likes" ON public.product_likes;

CREATE POLICY "Users can view own likes" ON public.product_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can insert own likes" ON public.product_likes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Users can delete own likes" ON public.product_likes FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage all likes" ON public.product_likes FOR ALL
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

-- Product reviews
DROP POLICY IF EXISTS "Product reviews readable by all" ON public.product_reviews;
DROP POLICY IF EXISTS "Product reviews insert" ON public.product_reviews;
DROP POLICY IF EXISTS "Product reviews update" ON public.product_reviews;
DROP POLICY IF EXISTS "Product reviews owner insert" ON public.product_reviews;
DROP POLICY IF EXISTS "Product reviews owner update" ON public.product_reviews;
DROP POLICY IF EXISTS "Admins can manage product reviews" ON public.product_reviews;

CREATE POLICY "Product reviews readable by all" ON public.product_reviews FOR SELECT
    USING (true);

CREATE POLICY "Product reviews owner insert" ON public.product_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Product reviews owner update" ON public.product_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage product reviews" ON public.product_reviews FOR ALL
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

-- Artwork reviews
DROP POLICY IF EXISTS "Artwork reviews readable by all" ON public.artwork_reviews;
DROP POLICY IF EXISTS "Artwork reviews insert" ON public.artwork_reviews;
DROP POLICY IF EXISTS "Artwork reviews update" ON public.artwork_reviews;
DROP POLICY IF EXISTS "Artwork reviews owner insert" ON public.artwork_reviews;
DROP POLICY IF EXISTS "Artwork reviews owner update" ON public.artwork_reviews;
DROP POLICY IF EXISTS "Admins can manage artwork reviews" ON public.artwork_reviews;

CREATE POLICY "Artwork reviews readable by all" ON public.artwork_reviews FOR SELECT
    USING (true);

CREATE POLICY "Artwork reviews owner insert" ON public.artwork_reviews FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Artwork reviews owner update" ON public.artwork_reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.profiles p
            WHERE p.id = user_id
              AND p.clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')
        )
    );

CREATE POLICY "Admins can manage artwork reviews" ON public.artwork_reviews FOR ALL
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

-- Admin-managed mockups
DROP POLICY IF EXISTS "garment_studio_mockups_public_read" ON public.garment_studio_mockups;
DROP POLICY IF EXISTS "garment_studio_mockups_admin_manage" ON public.garment_studio_mockups;
DROP POLICY IF EXISTS "Admins can manage garment studio mockups" ON public.garment_studio_mockups;

CREATE POLICY "garment_studio_mockups_public_read" ON public.garment_studio_mockups FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage garment studio mockups" ON public.garment_studio_mockups FOR ALL
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
