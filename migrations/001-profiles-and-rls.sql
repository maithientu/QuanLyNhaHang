-- Migration: create profiles table and enable RLS with basic policies
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'waiter',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and basic policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile and allow managers to read all
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (
  auth.role() = 'authenticated' AND (
    auth.uid() = id OR auth.jwt() ->> 'role' = 'manager'
  )
);

-- Allow managers to insert profiles
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  auth.jwt() ->> 'role' = 'manager'
);
