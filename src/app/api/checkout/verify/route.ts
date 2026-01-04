import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, PRODUCTS } from '@/lib/stripe';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
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

    // Retrieve the checkout session from Stripe
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if the session was successful
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const productType = session.metadata?.productType;
    
    if (!productType) {
      return NextResponse.json(
        { error: 'Unknown product type' },
        { status: 400 }
      );
    }

    // Check if this session has already been processed
    const serviceSupabase = await createServiceRoleClient();
    const { data: existingPurchase } = await serviceSupabase
      .from('purchases')
      .select('id')
      .eq('stripe_session_id', session.id)
      .single();

    // Get current profile
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('credits, subscription_status')
      .eq('id', user.id)
      .single();

    const currentCredits = profile?.credits || 0;

    // If the purchase already exists, just return the current credits
    if (existingPurchase) {
      return NextResponse.json({
        success: true,
        credits: currentCredits,
        message: 'Purchase already processed'
      });
    }

    // Process the purchase
    let newCredits = currentCredits;
    const updateData: Record<string, unknown> = {};

    if (productType === 'subscription') {
      updateData.subscription_status = 'trial';
    } else if (productType === 'bundle') {
      newCredits = currentCredits + 10;
      updateData.credits = newCredits;
    } else if (productType === 'single') {
      newCredits = currentCredits + 1;
      updateData.credits = newCredits;
    }

    // Update profile
    if (Object.keys(updateData).length > 0) {
      await serviceSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
    }

    // Create purchase record
    await serviceSupabase.from('purchases').insert({
      user_id: user.id,
      animation_id: null,
      stripe_session_id: session.id,
      product_type: productType,
      amount: session.amount_total || 0,
    });

    return NextResponse.json({
      success: true,
      credits: newCredits,
      productType,
    });
  } catch (error: any) {
    console.error('Checkout verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout' },
      { status: 500 }
    );
  }
}

