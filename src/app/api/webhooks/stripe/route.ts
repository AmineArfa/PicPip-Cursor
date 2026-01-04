import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  console.log('[Stripe Webhook] Processing checkout complete:', session.id);
  console.log('[Stripe Webhook] Metadata:', session.metadata);
  console.log('[Stripe Webhook] Customer email:', session.customer_email);
  
  const { animationId, guestSessionId, productType } = session.metadata || {};
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id;
  const customerEmail = session.customer_email;

  if (!customerEmail) {
    console.error('[Stripe Webhook] No customer email in session');
    return;
  }

  // animationId is optional for bundle/credits-only purchases
  const isRealAnimation = animationId && !['pricing-page', 'credits-only', 'bundle-only'].includes(animationId);

  const supabase = await createServiceRoleClient();

  // Check if user exists with this email
  const { data: existingUsers, error: lookupError } = await supabase
    .from('profiles')
    .select('id, credits')
    .eq('email', customerEmail)
    .limit(1);

  if (lookupError) {
    console.error('[Stripe Webhook] Error looking up user by email:', lookupError);
  }

  console.log('[Stripe Webhook] Found users by email:', existingUsers);

  let userId: string | null = null;
  let currentCredits = 0;

  if (existingUsers && existingUsers.length > 0) {
    userId = existingUsers[0].id;
    currentCredits = existingUsers[0].credits || 0;
    console.log(`[Stripe Webhook] Found user ${userId} with ${currentCredits} credits`);
  } else {
    console.log('[Stripe Webhook] No user found with email:', customerEmail);
  }

  // Update animation as paid if it's a real animation ID
  if (isRealAnimation) {
    const updateData: Record<string, unknown> = {
      is_paid: true,
    };

    // If we have a user, assign the animation to them
    if (userId) {
      updateData.user_id = userId;
      updateData.guest_session_id = null;
    }

    const { error: animationError } = await supabase
      .from('animations')
      .update(updateData)
      .eq('id', animationId);

    if (animationError) {
      console.error('[Stripe Webhook] Error updating animation:', animationError);
    }
  }

  // Create purchase record
  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId,
    animation_id: isRealAnimation ? animationId : null,
    stripe_session_id: session.id,
    product_type: productType || 'single',
    amount: session.amount_total || 0,
  });

  if (purchaseError) {
    console.error('[Stripe Webhook] Error creating purchase record:', purchaseError);
  }

  // Update user profile - award credits even without a Stripe customer ID
  if (userId) {
    const profileUpdate: Record<string, unknown> = {};

    // Set Stripe customer ID if we have one
    if (customerId) {
      profileUpdate.stripe_customer_id = customerId;
    }

    if (productType === 'subscription') {
      profileUpdate.subscription_status = 'trial';
      console.log(`[Stripe Webhook] Setting subscription status to trial for user ${userId}`);
    } else if (productType === 'bundle') {
      // Add 10 credits for bundle purchase
      profileUpdate.credits = currentCredits + 10;
      console.log(`[Stripe Webhook] Awarding 10 credits to user ${userId}. Prev: ${currentCredits}, New: ${profileUpdate.credits}`);
    } else if (productType === 'single') {
      // Award 1 credit for single purchase
      profileUpdate.credits = currentCredits + 1;
      console.log(`[Stripe Webhook] Awarding 1 credit to user ${userId}. Prev: ${currentCredits}, New: ${profileUpdate.credits}`);
    }

    if (Object.keys(profileUpdate).length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId);

      if (updateError) {
        console.error('[Stripe Webhook] Error updating profile:', updateError);
      } else {
        console.log('[Stripe Webhook] Profile updated successfully:', profileUpdate);
      }
    }
  }

  // If we have a guest session but no user yet, 
  // the data will be promoted when they click the magic link
  if (guestSessionId && !userId) {
    console.log('[Stripe Webhook] Guest purchase - awaiting auth:', { guestSessionId, animationId, customerEmail });
  }

  console.log('[Stripe Webhook] Checkout complete:', { animationId, productType, userId, customerEmail });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;

  const supabase = await createServiceRoleClient();

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!profile) {
    console.error('No profile found for customer:', customerId);
    return;
  }

  // Map Stripe status to our status
  let status: 'none' | 'trial' | 'active' | 'cancelled' = 'none';
  
  switch (subscription.status) {
    case 'trialing':
      status = 'trial';
      break;
    case 'active':
      status = 'active';
      break;
    case 'canceled':
    case 'unpaid':
    case 'past_due':
      status = 'cancelled';
      break;
  }

  await supabase
    .from('profiles')
    .update({ subscription_status: status })
    .eq('id', profile.id);

  console.log('Subscription updated:', { userId: profile.id, status });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripeServer();
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

