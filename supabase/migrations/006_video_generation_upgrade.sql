-- PicPip Video Generation Upgrade Migration
-- Adds support for format selection, quality tiers, and AI-enhanced prompts

-- ============================================
-- 1. Add new columns to profiles table
-- ============================================

-- Track daily High Quality generation count for unlimited users (5/day limit)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS high_quality_count_today INTEGER DEFAULT 0;

-- Date for resetting daily counter
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS high_quality_reset_date DATE DEFAULT CURRENT_DATE;

-- ============================================
-- 2. Add new columns to animations table
-- ============================================

-- Quality mode: 'fast' (gen4_turbo, 1 credit) or 'high' (gen4, 2 credits)
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS quality_mode TEXT DEFAULT 'fast';

-- Video format: tiktok, instagram_reel, instagram_square, instagram_portrait, landscape
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS format TEXT DEFAULT 'landscape';

-- Video duration in seconds (5 or 10)
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 10;

-- User's selected action prompt text
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS prompt_text TEXT;

-- AI-enhanced prompt (from Gemini) sent to Runway - saved for debugging/improvement
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS ai_enhanced_prompt TEXT;

-- Credits used for this animation (1 for fast, 2 for high)
ALTER TABLE animations 
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 1;

-- ============================================
-- 3. Create updated use_credit function with quality tiers
-- ============================================

CREATE OR REPLACE FUNCTION use_credit_for_animation_v2(
  p_user_id UUID,
  p_animation_id UUID,
  p_quality_mode TEXT DEFAULT 'fast'
)
RETURNS TABLE(success BOOLEAN, message TEXT, new_credits INTEGER, daily_high_remaining INTEGER) AS $$
DECLARE
  v_profile RECORD;
  v_animation RECORD;
  v_new_credits INTEGER;
  v_is_subscribed BOOLEAN;
  v_credit_cost INTEGER;
  v_high_quality_count INTEGER;
  v_daily_limit INTEGER := 5;  -- Daily limit for High Quality for unlimited users
BEGIN
  -- Determine credit cost based on quality mode
  IF p_quality_mode = 'high' THEN
    v_credit_cost := 2;
  ELSE
    v_credit_cost := 1;
  END IF;

  -- Lock the profile row to prevent race conditions
  SELECT credits, subscription_status, high_quality_count_today, high_quality_reset_date
  INTO v_profile
  FROM profiles 
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User profile not found'::TEXT, 0, 0;
    RETURN;
  END IF;
  
  -- Check if user has active subscription
  v_is_subscribed := v_profile.subscription_status IN ('active', 'trial');
  
  -- Reset daily counter if it's a new day
  v_high_quality_count := v_profile.high_quality_count_today;
  IF v_profile.high_quality_reset_date < CURRENT_DATE THEN
    v_high_quality_count := 0;
    UPDATE profiles 
    SET high_quality_count_today = 0, high_quality_reset_date = CURRENT_DATE
    WHERE id = p_user_id;
  END IF;
  
  -- Check if animation exists
  SELECT id, is_paid, user_id INTO v_animation
  FROM animations
  WHERE id = p_animation_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Animation not found'::TEXT, v_profile.credits::INTEGER, (v_daily_limit - v_high_quality_count)::INTEGER;
    RETURN;
  END IF;
  
  -- If already paid, just return success
  IF v_animation.is_paid THEN
    RETURN QUERY SELECT TRUE, 'Animation already unlocked'::TEXT, v_profile.credits::INTEGER, (v_daily_limit - v_high_quality_count)::INTEGER;
    RETURN;
  END IF;
  
  -- For subscribers requesting High Quality, check daily limit
  IF v_is_subscribed AND p_quality_mode = 'high' THEN
    IF v_high_quality_count >= v_daily_limit THEN
      RETURN QUERY SELECT FALSE, 'Daily High Quality limit reached (5/day). Try again tomorrow or use Fast mode.'::TEXT, v_profile.credits::INTEGER, 0;
      RETURN;
    END IF;
    
    -- Increment the high quality counter for subscribers
    v_high_quality_count := v_high_quality_count + 1;
    UPDATE profiles 
    SET high_quality_count_today = v_high_quality_count
    WHERE id = p_user_id;
    
    v_new_credits := v_profile.credits;
  ELSIF v_is_subscribed THEN
    -- Fast mode for subscribers - unlimited, no credit deduction
    v_new_credits := v_profile.credits;
  ELSE
    -- Non-subscribers: check if they have enough credits
    IF v_profile.credits < v_credit_cost THEN
      RETURN QUERY SELECT FALSE, format('Not enough credits. Need %s, have %s', v_credit_cost, v_profile.credits)::TEXT, v_profile.credits::INTEGER, 0;
      RETURN;
    END IF;
    
    -- Deduct credits
    v_new_credits := v_profile.credits - v_credit_cost;
    
    UPDATE profiles 
    SET credits = v_new_credits
    WHERE id = p_user_id;
  END IF;
  
  -- Mark animation as paid and assign to user
  UPDATE animations
  SET is_paid = TRUE,
      user_id = p_user_id,
      guest_session_id = NULL,
      quality_mode = p_quality_mode,
      credits_used = v_credit_cost
  WHERE id = p_animation_id;
  
  -- Return success with appropriate message
  IF v_is_subscribed THEN
    IF p_quality_mode = 'high' THEN
      RETURN QUERY SELECT TRUE, format('Animation unlocked with subscription (High Quality %s/%s today)', v_high_quality_count, v_daily_limit)::TEXT, v_new_credits, (v_daily_limit - v_high_quality_count)::INTEGER;
    ELSE
      RETURN QUERY SELECT TRUE, 'Animation unlocked with subscription (Fast mode)'::TEXT, v_new_credits, (v_daily_limit - v_high_quality_count)::INTEGER;
    END IF;
  ELSE
    RETURN QUERY SELECT TRUE, format('Animation unlocked with %s credit(s)', v_credit_cost)::TEXT, v_new_credits, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION use_credit_for_animation_v2(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION use_credit_for_animation_v2(UUID, UUID, TEXT) TO service_role;

-- ============================================
-- 4. Create helper function to check daily limit
-- ============================================

CREATE OR REPLACE FUNCTION get_daily_high_quality_remaining(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_date DATE;
  v_daily_limit INTEGER := 5;
BEGIN
  SELECT high_quality_count_today, high_quality_reset_date
  INTO v_count, v_reset_date
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Reset if new day
  IF v_reset_date < CURRENT_DATE THEN
    RETURN v_daily_limit;
  END IF;
  
  RETURN GREATEST(0, v_daily_limit - v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_daily_high_quality_remaining(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_high_quality_remaining(UUID) TO service_role;

