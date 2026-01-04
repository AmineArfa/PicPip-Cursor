import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';
import { CREDIT_COSTS } from '@/lib/stripe';
import type { QualityMode } from '@/lib/supabase/types';

interface UseCreditRequest {
  animationId: string;
  qualityMode?: QualityMode;
}

/**
 * Use credit(s) to unlock an animation
 * Requires authenticated user with available credits or active subscription
 * Fast mode = 1 credit, High mode = 2 credits
 * Subscribers: Unlimited Fast, 5 High per day
 */
export async function POST(request: NextRequest) {
  try {
    const body: UseCreditRequest = await request.json();
    const { animationId, qualityMode = 'fast' } = body;

    if (!animationId) {
      return NextResponse.json(
        { error: 'Animation ID is required' },
        { status: 400 }
      );
    }

    // Validate quality mode
    if (qualityMode !== 'fast' && qualityMode !== 'high') {
      return NextResponse.json(
        { error: 'Invalid quality mode. Must be "fast" or "high"' },
        { status: 400 }
      );
    }

    const creditCost = CREDIT_COSTS[qualityMode];

    // Get the current user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const serviceSupabase = await createServiceRoleClient();

    // Try to use the new v2 atomic RPC function first (with quality mode support)
    try {
      const { data: result, error: rpcError } = await serviceSupabase
        .rpc('use_credit_for_animation_v2', {
          p_user_id: user.id,
          p_animation_id: animationId,
          p_quality_mode: qualityMode
        });

      if (!rpcError && result && result.length > 0) {
        const resultRow = result[0];
        
        if (!resultRow.success) {
          const message = resultRow.message || 'Failed to use credit';
          const statusCode = message.includes('credits') || message.includes('limit') ? 402 : 400;
          return NextResponse.json(
            { 
              error: message,
              credits: resultRow.new_credits || 0,
              dailyHighRemaining: resultRow.daily_high_remaining || 0
            },
            { status: statusCode }
          );
        }

        // Create a purchase record for tracking
        const isSubscription = resultRow.message?.includes('subscription');
        await serviceSupabase.from('purchases').insert({
          user_id: user.id,
          animation_id: animationId,
          stripe_session_id: null,
          product_type: isSubscription ? 'subscription' : 'single',
          amount: 0,
        });

        return NextResponse.json({
          success: true,
          credits: resultRow.new_credits,
          dailyHighRemaining: resultRow.daily_high_remaining,
          usedSubscription: isSubscription,
          qualityMode,
          creditsUsed: creditCost,
          message: resultRow.message
        });
      }
      
      // If RPC failed, fall through to manual implementation
      if (rpcError) {
        console.warn('RPC v2 not available, trying v1:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('RPC v2 function not available, using fallback implementation');
    }

    // Try the old v1 RPC function (for backwards compatibility, only for fast mode)
    if (qualityMode === 'fast') {
      try {
        const { data: result, error: rpcError } = await serviceSupabase
          .rpc('use_credit_for_animation', {
            p_user_id: user.id,
            p_animation_id: animationId
          });

        if (!rpcError && result && result.length > 0) {
          const resultRow = result[0];
          
          if (!resultRow.success) {
            const message = resultRow.message || 'Failed to use credit';
            const statusCode = message.includes('No credits') ? 402 : 400;
            return NextResponse.json(
              { 
                error: message,
                credits: resultRow.new_credits || 0
              },
              { status: statusCode }
            );
          }

          // Create a purchase record for tracking
          const isSubscription = resultRow.message?.includes('subscription');
          await serviceSupabase.from('purchases').insert({
            user_id: user.id,
            animation_id: animationId,
            stripe_session_id: null,
            product_type: isSubscription ? 'subscription' : 'single',
            amount: 0,
          });

          return NextResponse.json({
            success: true,
            credits: resultRow.new_credits,
            usedSubscription: isSubscription,
            qualityMode: 'fast',
            creditsUsed: 1,
            message: resultRow.message
          });
        }
        
        if (rpcError) {
          console.warn('RPC v1 not available, using fallback:', rpcError.message);
        }
      } catch (rpcErr) {
        console.warn('RPC v1 function not available, using fallback implementation');
      }
    }

    // FALLBACK: Manual implementation if RPC doesn't exist
    // Get user's profile with daily limit tracking
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('credits, subscription_status, high_quality_count_today, high_quality_reset_date')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    const hasActiveSubscription = profile.subscription_status === 'active' || profile.subscription_status === 'trial';
    
    // Reset daily counter if it's a new day
    const today = new Date().toISOString().split('T')[0];
    let highQualityCount = profile.high_quality_count_today || 0;
    if (profile.high_quality_reset_date !== today) {
      highQualityCount = 0;
      await serviceSupabase
        .from('profiles')
        .update({ high_quality_count_today: 0, high_quality_reset_date: today })
        .eq('id', user.id);
    }

    const dailyLimit = 5;
    const dailyHighRemaining = Math.max(0, dailyLimit - highQualityCount);

    // Check if user can use credits
    if (hasActiveSubscription) {
      // Subscribers: unlimited fast, limited high quality
      if (qualityMode === 'high' && highQualityCount >= dailyLimit) {
        return NextResponse.json(
          { 
            error: 'Daily High Quality limit reached (5/day). Try again tomorrow or use Fast mode.',
            credits: profile.credits,
            dailyHighRemaining: 0
          },
          { status: 402 }
        );
      }
    } else {
      // Non-subscribers: need enough credits
      if (profile.credits < creditCost) {
        return NextResponse.json(
          { 
            error: `Not enough credits. Need ${creditCost}, have ${profile.credits}`,
            credits: profile.credits,
            subscription_status: profile.subscription_status
          },
          { status: 402 }
        );
      }
    }

    // Check if animation exists and isn't already paid
    const { data: animation, error: animationError } = await serviceSupabase
      .from('animations')
      .select('id, is_paid, user_id')
      .eq('id', animationId)
      .single();

    if (animationError || !animation) {
      return NextResponse.json(
        { error: 'Animation not found' },
        { status: 404 }
      );
    }

    if (animation.is_paid) {
      return NextResponse.json({
        success: true,
        message: 'Animation already unlocked',
        credits: profile.credits,
        dailyHighRemaining
      });
    }

    // Use credit(s)
    let newCredits = profile.credits;
    let newHighCount = highQualityCount;
    
    if (hasActiveSubscription) {
      // Subscribers: track high quality usage, no credit deduction
      if (qualityMode === 'high') {
        newHighCount = highQualityCount + 1;
        await serviceSupabase
          .from('profiles')
          .update({ high_quality_count_today: newHighCount })
          .eq('id', user.id);
      }
    } else {
      // Non-subscribers: deduct credits
      newCredits = profile.credits - creditCost;
      
      const { error: creditError } = await serviceSupabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id);

      if (creditError) {
        console.error('Error deducting credit:', creditError);
        return NextResponse.json(
          { error: 'Failed to use credit' },
          { status: 500 }
        );
      }
    }

    // Mark animation as paid and assign to user
    const { error: updateError } = await serviceSupabase
      .from('animations')
      .update({ 
        is_paid: true, 
        user_id: user.id,
        guest_session_id: null,
        quality_mode: qualityMode,
        credits_used: creditCost
      })
      .eq('id', animationId);

    if (updateError) {
      console.error('Error updating animation:', updateError);
      // Try to refund the credit if animation update fails
      if (!hasActiveSubscription) {
        await serviceSupabase
          .from('profiles')
          .update({ credits: profile.credits })
          .eq('id', user.id);
      }
      return NextResponse.json(
        { error: 'Failed to unlock animation' },
        { status: 500 }
      );
    }

    // Create a purchase record
    await serviceSupabase.from('purchases').insert({
      user_id: user.id,
      animation_id: animationId,
      stripe_session_id: null,
      product_type: hasActiveSubscription ? 'subscription' : 'single',
      amount: 0,
    });

    const newDailyRemaining = hasActiveSubscription && qualityMode === 'high' 
      ? Math.max(0, dailyLimit - newHighCount)
      : dailyHighRemaining;

    return NextResponse.json({
      success: true,
      credits: newCredits,
      dailyHighRemaining: newDailyRemaining,
      usedSubscription: hasActiveSubscription,
      qualityMode,
      creditsUsed: hasActiveSubscription ? 0 : creditCost,
      message: hasActiveSubscription 
        ? qualityMode === 'high'
          ? `Animation unlocked with subscription (High Quality ${newHighCount}/${dailyLimit} today)`
          : 'Animation unlocked with subscription (Fast mode)'
        : `Animation unlocked with ${creditCost} credit(s)`
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Use credit error:', errorMessage);
    return NextResponse.json(
      { error: errorMessage || 'Failed to use credit' },
      { status: 500 }
    );
  }
}
