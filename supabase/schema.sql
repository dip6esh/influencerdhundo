-- Schema for Influencer Dhundo on Supabase

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
  -- Referral system fields
  referral_code TEXT UNIQUE,
  referred_by TEXT,  -- creator id of who referred this creator
  trial_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  referral_bonus_days INTEGER NOT NULL DEFAULT 0,
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  is_trial BOOLEAN NOT NULL DEFAULT FALSE,
  referral_code_used TEXT,  -- code used at signup
  is_queued BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. REFERRAL EVENTS TABLE
-- Tracks every time a referral reward is earned or reversed
CREATE TABLE IF NOT EXISTS public.referral_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  referrer_id TEXT NOT NULL,          -- creator who made the referral
  referred_creator_id TEXT NOT NULL,  -- creator who was referred
  referred_sub_id TEXT,               -- subscription id that triggered this event
  days_delta INTEGER NOT NULL,        -- +3 for earned, -3 for reversed
  event_type TEXT NOT NULL,           -- 'earned' | 'reversed'
  note TEXT NOT NULL DEFAULT '',      -- human-readable explanation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

-- Creators policies
CREATE POLICY "Public can view creators" 
  ON public.creators FOR SELECT USING (true);

CREATE POLICY "Public can insert creators" 
  ON public.creators FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update creators" 
  ON public.creators FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public can delete creators" 
  ON public.creators FOR DELETE USING (true);

-- Business accounts policies
CREATE POLICY "Public can manage business accounts" 
  ON public.business_accounts FOR ALL USING (true) WITH CHECK (true);

-- Reports policies
CREATE POLICY "Public can insert and view reports" 
  ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- Subscriptions policies
CREATE POLICY "Public can manage subscriptions" 
  ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- Referral events policies
CREATE POLICY "Public can manage referral events"
  ON public.referral_events FOR ALL USING (true) WITH CHECK (true);

-- 6. STORAGE BUCKET FOR CREATOR PROFILE PHOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-photos', 'creator-photos', true)
ON CONFLICT (id) DO NOTHING;

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

-- MIGRATION: Add referral columns to existing tables if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='creators' AND column_name='referral_code') THEN
    ALTER TABLE public.creators ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='creators' AND column_name='referred_by') THEN
    ALTER TABLE public.creators ADD COLUMN referred_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='creators' AND column_name='trial_started_at') THEN
    ALTER TABLE public.creators ADD COLUMN trial_started_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='creators' AND column_name='subscription_expires_at') THEN
    ALTER TABLE public.creators ADD COLUMN subscription_expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='creators' AND column_name='referral_bonus_days') THEN
    ALTER TABLE public.creators ADD COLUMN referral_bonus_days INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='expires_at') THEN
    ALTER TABLE public.subscriptions ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='is_trial') THEN
    ALTER TABLE public.subscriptions ADD COLUMN is_trial BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='referral_code_used') THEN
    ALTER TABLE public.subscriptions ADD COLUMN referral_code_used TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='is_queued') THEN
    ALTER TABLE public.subscriptions ADD COLUMN is_queued BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='status') THEN
    ALTER TABLE public.subscriptions ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='razorpay_order_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN razorpay_order_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='razorpay_payment_id') THEN
    ALTER TABLE public.subscriptions ADD COLUMN razorpay_payment_id TEXT;
  END IF;
END $$;

-- 7. PAYMENTS TABLE (Razorpay audit log)
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  creator_id TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'captured',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can manage payments"
  ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- 8. DISCOUNT & REFERRAL PROMO CODES TABLE
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' | 'flat'
  discount_value NUMERIC NOT NULL DEFAULT 0,
  validity_days INTEGER NOT NULL DEFAULT 1,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  notes TEXT DEFAULT '',
  target_email TEXT DEFAULT NULL,
  target_phone TEXT DEFAULT NULL,
  applicable_plans TEXT[] DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active discount codes"
  ON public.discount_codes FOR SELECT USING (true);
CREATE POLICY "Admins full access to discount codes"
  ON public.discount_codes FOR ALL USING (true) WITH CHECK (true);

