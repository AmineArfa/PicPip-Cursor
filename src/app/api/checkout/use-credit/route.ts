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

    // Use database function for atomic, race-condition-safe credit deduction
    const { data: result, error: rpcError } = await serviceSupabase
      .rpc('use_credit_for_animation', {
        p_user_id: user.id,
        p_animation_id: animationId
      });

    if (rpcError) {
      console.error('RPC error:', rpcError);
      return NextResponse.json(
        { error: 'Failed to process credit' },
        { status: 500 }
      );
    }

    const resultRow = result?.[0];
    
    if (!resultRow?.success) {
      const message = resultRow?.message || 'Failed to use credit';
      const statusCode = message.includes('No credits') ? 402 : 400;
      return NextResponse.json(
        { 
          error: message,
          credits: resultRow?.new_credits || 0
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
      amount: 0, // Credit was already purchased
    });

    return NextResponse.json({
      success: true,
      credits: resultRow.new_credits,
      usedSubscription: isSubscription,
      message: resultRow.message
    });
  } catch (error: any) {
    console.error('Use credit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to use credit' },
      { status: 500 }
    );
  }
}


