-- Function to atomically use a credit for an animation
-- This prevents race conditions when multiple requests try to use credits

CREATE OR REPLACE FUNCTION use_credit_for_animation(
  p_user_id UUID,
  p_animation_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT, new_credits INTEGER) AS $$
DECLARE
  v_profile RECORD;
  v_animation RECORD;
  v_new_credits INTEGER;
  v_is_subscribed BOOLEAN;
BEGIN
  -- Lock the profile row to prevent race conditions
  SELECT credits, subscription_status 
  INTO v_profile
  FROM profiles 
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'User profile not found'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check if user has active subscription
  v_is_subscribed := v_profile.subscription_status IN ('active', 'trial');
  
  -- Check if animation exists
  SELECT id, is_paid, user_id INTO v_animation
  FROM animations
  WHERE id = p_animation_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Animation not found'::TEXT, v_profile.credits::INTEGER;
    RETURN;
  END IF;
  
  -- If already paid, just return success
  IF v_animation.is_paid THEN
    RETURN QUERY SELECT TRUE, 'Animation already unlocked'::TEXT, v_profile.credits::INTEGER;
    RETURN;
  END IF;
  
  -- Check if user can unlock (has subscription or credits)
  IF NOT v_is_subscribed AND v_profile.credits <= 0 THEN
    RETURN QUERY SELECT FALSE, 'No credits available'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Deduct credit if not on subscription
  IF v_is_subscribed THEN
    v_new_credits := v_profile.credits;
  ELSE
    v_new_credits := v_profile.credits - 1;
    
    UPDATE profiles 
    SET credits = v_new_credits
    WHERE id = p_user_id;
  END IF;
  
  -- Mark animation as paid and assign to user
  UPDATE animations
  SET is_paid = TRUE,
      user_id = p_user_id,
      guest_session_id = NULL
  WHERE id = p_animation_id;
  
  -- Return success
  IF v_is_subscribed THEN
    RETURN QUERY SELECT TRUE, 'Animation unlocked with subscription'::TEXT, v_new_credits;
  ELSE
    RETURN QUERY SELECT TRUE, 'Animation unlocked with 1 credit'::TEXT, v_new_credits;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION use_credit_for_animation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_credit_for_animation(UUID, UUID) TO service_role;

