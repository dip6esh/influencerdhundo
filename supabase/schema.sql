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
  contact JSONB NOT NULL DEFAULT '{"phone":"","whatsapp":"","email":""}'::jsonb,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

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

-- 5. STORAGE BUCKET FOR CREATOR PROFILE PHOTOS
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

