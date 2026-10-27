-- Schema for Influencer Dhundo on Supabase (Synchronized & Canonical)

-- 1. CREATORS TABLE
CREATE TABLE IF NOT EXISTS public.creators (
  id TEXT PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  photo TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL,
  locality TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '',
  pincode TEXT NOT NULL DEFAULT '',
  followers INTEGER NOT NULL DEFAULT 0,
  instagram TEXT NOT NULL DEFAULT '',
  other_socials JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories TEXT[] NOT NULL DEFAULT '{}',
  content_types TEXT[] NOT NULL DEFAULT '{}',
  languages TEXT[] NOT NULL DEFAULT '{}',
  about TEXT NOT NULL DEFAULT '',
  collab_type TEXT NOT NULL DEFAULT 'Paid',
  starting_price INTEGER NOT NULL DEFAULT 0,
  travels BOOLEAN NOT NULL DEFAULT FALSE,
  travel_range TEXT,
  accepts_products TEXT NOT NULL DEFAULT 'Depends',
  accepts_products_details TEXT DEFAULT '',
  turnaround TEXT NOT NULL DEFAULT '3–5 days',
  status TEXT NOT NULL DEFAULT 'Active',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  birth_date DATE,
  gender TEXT,
  contact JSONB NOT NULL DEFAULT '{"phone":"","whatsapp":"","email":""}'::jsonb,
  -- Referral & Subscription system fields
  referral_code TEXT UNIQUE,
  referred_by TEXT,  -- creator id or code of referrer
  trial_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  referral_bonus_days INTEGER NOT NULL DEFAULT 0,
  special_referral_program JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BUSINESS ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.business_accounts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  at TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  creator_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN DEFAULT FALSE,
  referral_code_used TEXT,
  is_queued BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. REFERRAL EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL,
  referred_creator_id TEXT NOT NULL,
  referred_sub_id TEXT,
  days_delta INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('earned', 'reversed', 'cash_earned', 'cash_reversed', 'withdrawn')),
  note TEXT,
  cash_delta INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PAYMENTS TABLE (Razorpay audit log)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  creator_id TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'captured',
  promo_code_used TEXT,
  referral_code_used TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DISCOUNT & PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  notes TEXT DEFAULT '',
  target_email TEXT DEFAULT NULL,
  target_phone TEXT DEFAULT NULL,
  applicable_plans TEXT[] DEFAULT ARRAY['all'::text],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. REFERRAL WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.referral_withdrawal_requests (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  creator_name TEXT NOT NULL,
  creator_email TEXT,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payout_details JSONB NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMPTZ,
  utr_number TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. ADMIN ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. WEBSITE VISITS / ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS public.website_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  full_url TEXT,
  referrer TEXT,
  referrer_source TEXT DEFAULT 'Direct',
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'India',
  country_code TEXT DEFAULT 'IN',
  ip_masked TEXT,
  device_type TEXT DEFAULT 'Desktop',
  browser TEXT DEFAULT 'Other',
  os TEXT DEFAULT 'Other',
  screen_resolution TEXT,
  creator_id TEXT,
  creator_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ROW LEVEL SECURITY (RLS) POLICIES ─────────────────────────────────────
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_visits ENABLE ROW LEVEL SECURITY;

-- Policies for public & authenticated access
CREATE POLICY "Public can view creators" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Public can insert creators" ON public.creators FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update creators" ON public.creators FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public can delete creators" ON public.creators FOR DELETE USING (true);

CREATE POLICY "Public can manage business accounts" ON public.business_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage subscriptions" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage referral events" ON public.referral_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can read active discount codes" ON public.discount_codes FOR SELECT USING (true);
CREATE POLICY "Admins full access to discount codes" ON public.discount_codes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can manage referral withdrawal requests" ON public.referral_withdrawal_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public can read admin accounts" ON public.admin_accounts FOR SELECT USING (true);
CREATE POLICY "Public can insert and read website visits" ON public.website_visits FOR ALL USING (true) WITH CHECK (true);

-- ── STORAGE BUCKET FOR CREATOR PROFILE PHOTOS ──────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-photos',
  'creator-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access creator-photos'
  ) THEN
    CREATE POLICY "Public Access creator-photos" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'creator-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Upload creator-photos'
  ) THEN
    CREATE POLICY "Public Upload creator-photos" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'creator-photos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Update creator-photos'
  ) THEN
    CREATE POLICY "Public Update creator-photos" 
    ON storage.objects FOR UPDATE 
    USING (bucket_id = 'creator-photos');
  END IF;
END $$;

-- ── PERFORMANCE INDEXES ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_creators_auth_user_id ON public.creators(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_creators_referral_code ON public.creators(referral_code);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id ON public.subscriptions(creator_id);
CREATE INDEX IF NOT EXISTS idx_business_accounts_auth_user_id ON public.business_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referrer_id ON public.referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_referred_creator_id ON public.referral_events(referred_creator_id);
CREATE INDEX IF NOT EXISTS idx_payments_creator_id ON public.payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_website_visits_session ON public.website_visits(session_id);
