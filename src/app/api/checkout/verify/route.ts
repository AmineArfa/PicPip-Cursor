import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    console.log('[Verify Checkout] Starting verification for session:', sessionId);

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session ID' }, { status: 400 });
    }

    // Get the current user
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Verify Checkout] Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('[Verify Checkout] User:', user.id, user.email);

    // Retrieve the checkout session from Stripe
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if the session was successful
    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const productType = session.metadata?.productType;
    if (!productType) {
      return NextResponse.json({ error: 'Unknown product type' }, { status: 400 });
    }

    console.log('[Verify Checkout] Product type:', productType);

    const serviceSupabase = await createServiceRoleClient();

    // Check if purchase exists
    const { data: existingPurchase } = await serviceSupabase
      .from('purchases')
      .select('id, user_id')
      .eq('stripe_session_id', session.id)
      .single();

    if (!existingPurchase) {
      // Purchase doesn't exist - create it with user_id
      // The database trigger will automatically add credits
      console.log('[Verify Checkout] Creating new purchase with user_id');
      await serviceSupabase.from('purchases').insert({
        user_id: user.id,
        stripe_session_id: session.id,
        product_type: productType,
        amount: session.amount_total || 0,
      });
    } else if (existingPurchase.user_id === null) {
      // Purchase exists but has no user_id - update it
      // The database trigger will automatically add credits on this update
      console.log('[Verify Checkout] Updating existing purchase with user_id');
      await serviceSupabase
        .from('purchases')
        .update({ user_id: user.id })
        .eq('id', existingPurchase.id);
    } else {
      console.log('[Verify Checkout] Purchase already has user_id');
    }

    // Small delay to ensure triggers have executed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get updated credits
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    console.log('[Verify Checkout] Final credits:', profile?.credits);

    return NextResponse.json({
      success: true,
      credits: profile?.credits || 0,
      productType,
    });
  } catch (error: any) {
    console.error('[Verify Checkout] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify checkout' },
      { status: 500 }
    );
  }
}

