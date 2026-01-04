import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Use a credit to unlock an animation
 * Requires authenticated user with available credits or active subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { animationId } = await request.json();

    if (!animationId) {
      return NextResponse.json(
        { error: 'Animation ID is required' },
        { status: 400 }
      );
    }

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

    // Try to use the atomic RPC function first
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
          message: resultRow.message
        });
      }
      
      // If RPC failed, fall through to manual implementation
      if (rpcError) {
        console.warn('RPC not available, using fallback:', rpcError.message);
      }
    } catch (rpcErr) {
      console.warn('RPC function not available, using fallback implementation');
    }

    // FALLBACK: Manual implementation if RPC doesn't exist
    // Get user's profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('credits, subscription_status')
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
    const hasCredits = profile.credits > 0;

    // Check if user can use a credit
    if (!hasActiveSubscription && !hasCredits) {
      return NextResponse.json(
        { 
          error: 'No credits available',
          credits: profile.credits,
          subscription_status: profile.subscription_status
        },
        { status: 402 }
      );
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
        credits: profile.credits
      });
    }

    // Use credit (only deduct if not on subscription)
    let newCredits = profile.credits;
    
    if (!hasActiveSubscription) {
      newCredits = profile.credits - 1;
      
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
        guest_session_id: null 
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

    return NextResponse.json({
      success: true,
      credits: newCredits,
      usedSubscription: hasActiveSubscription,
      message: hasActiveSubscription 
        ? 'Animation unlocked with subscription' 
        : 'Animation unlocked with 1 credit'
    });
  } catch (error: any) {
    console.error('Use credit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to use credit' },
      { status: 500 }
    );
  }
}
