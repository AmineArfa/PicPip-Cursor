-- PicPip.co Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE subscription_status AS ENUM ('none', 'trial', 'active', 'cancelled');
CREATE TYPE animation_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE product_type AS ENUM ('single', 'bundle', 'subscription');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  credits INTEGER DEFAULT 0,
  subscription_status subscription_status DEFAULT 'none',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Animations table
CREATE TABLE animations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  guest_session_id TEXT,
  title TEXT,
  original_photo_url TEXT NOT NULL,
  video_url TEXT,
  watermarked_video_url TEXT,
  thumbnail_url TEXT,
  status animation_status DEFAULT 'pending',
  is_paid BOOLEAN DEFAULT FALSE,
  runway_job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for guest session lookups
CREATE INDEX idx_animations_guest_session ON animations(guest_session_id) WHERE guest_session_id IS NOT NULL;

-- Create index for user lookups
CREATE INDEX idx_animations_user_id ON animations(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS on animations
ALTER TABLE animations ENABLE ROW LEVEL SECURITY;

-- Animations policies
CREATE POLICY "Users can view own animations" ON animations
  FOR SELECT USING (
    auth.uid() = user_id OR 
    guest_session_id IS NOT NULL
  );

CREATE POLICY "Anyone can insert animations" ON animations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own animations" ON animations
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    guest_session_id IS NOT NULL
  );

-- Service role bypass for webhooks
CREATE POLICY "Service role can do anything" ON animations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  animation_id UUID REFERENCES animations(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  product_type product_type NOT NULL,
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert purchases" ON purchases
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to promote guest data to user
CREATE OR REPLACE FUNCTION promote_guest_to_user(
  p_guest_session_id TEXT,
  p_user_id UUID,
  p_stripe_customer_id TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update animations
  UPDATE animations
  SET user_id = p_user_id,
      guest_session_id = NULL,
      is_paid = TRUE
  WHERE guest_session_id = p_guest_session_id;
  
  -- Update profile with stripe customer id if provided
  IF p_stripe_customer_id IS NOT NULL THEN
    UPDATE profiles
    SET stripe_customer_id = p_stripe_customer_id
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

