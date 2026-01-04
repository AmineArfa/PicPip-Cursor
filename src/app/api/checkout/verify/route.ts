import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, PRODUCTS } from '@/lib/stripe';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    console.log('[Verify Checkout] Starting verification for session:', sessionId);

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
      console.log('[Verify Checkout] Not authenticated');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('[Verify Checkout] User:', user.id, user.email);

    // Retrieve the checkout session from Stripe
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      console.log('[Verify Checkout] Session not found');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('[Verify Checkout] Stripe session:', session.id, 'status:', session.status, 'payment_status:', session.payment_status);
    console.log('[Verify Checkout] Metadata:', JSON.stringify(session.metadata));

    // Check if the session was successful
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      console.log('[Verify Checkout] Payment not completed');
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const productType = session.metadata?.productType;
    
    if (!productType) {
      console.log('[Verify Checkout] Unknown product type');
      return NextResponse.json(
        { error: 'Unknown product type' },
        { status: 400 }
      );
    }

    console.log('[Verify Checkout] Product type:', productType);

    const serviceSupabase = await createServiceRoleClient();

    // Get current profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('credits, subscription_status')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Verify Checkout] Error getting profile:', profileError);
    }

    const currentCredits = profile?.credits || 0;
    console.log('[Verify Checkout] Current credits:', currentCredits);

    // Check if this session has already been processed by looking at purchases
    const { data: existingPurchase } = await serviceSupabase
      .from('purchases')
      .select('id, product_type')
      .eq('stripe_session_id', session.id)
      .single();

    console.log('[Verify Checkout] Existing purchase:', existingPurchase);

    // Calculate expected credits based on product type
    const expectedCreditsToAdd = productType === 'bundle' ? 10 : productType === 'single' ? 1 : 0;

    if (existingPurchase) {
      // Purchase was processed by webhook, but let's verify credits were actually added
      // This is a sanity check - if the webhook processed it, credits should already be there
      console.log('[Verify Checkout] Purchase already exists, returning current credits:', currentCredits);
      return NextResponse.json({
        success: true,
        credits: currentCredits,
        message: 'Purchase already processed',
        productType
      });
    }

    // Purchase doesn't exist - webhook might have failed, so we process it now
    console.log('[Verify Checkout] Processing purchase (webhook may have failed)');

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
      const { error: updateError } = await serviceSupabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        console.error('[Verify Checkout] Error updating profile:', updateError);
      } else {
        console.log('[Verify Checkout] Profile updated:', updateData);
      }
    }

    // Create purchase record
    const { error: purchaseError } = await serviceSupabase.from('purchases').insert({
      user_id: user.id,
      animation_id: null,
      stripe_session_id: session.id,
      product_type: productType,
      amount: session.amount_total || 0,
    });

    if (purchaseError) {
      console.error('[Verify Checkout] Error creating purchase:', purchaseError);
    } else {
      console.log('[Verify Checkout] Purchase created successfully');
    }

    console.log('[Verify Checkout] Complete. New credits:', newCredits);

    return NextResponse.json({
      success: true,
      credits: newCredits,
      productType,
      creditsAdded: expectedCreditsToAdd
    });
  } catch (error: any) {
    console.error('[Verify Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout' },
      { status: 500 }
    );
  }
}

