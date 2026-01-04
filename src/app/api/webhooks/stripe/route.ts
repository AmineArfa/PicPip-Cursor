import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { createServiceRoleClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Disable body parsing, need raw body for signature verification
export const runtime = 'nodejs';

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const { animationId, guestSessionId, productType } = session.metadata || {};
  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id;
  const customerEmail = session.customer_email;

  // animationId is optional for bundle/credits-only purchases
  const isRealAnimation = animationId && !['pricing-page', 'credits-only', 'bundle-only'].includes(animationId);

  const supabase = await createServiceRoleClient();

  // Check if user exists with this email
  const { data: existingUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', customerEmail)
    .limit(1);

  let userId: string | null = null;

  if (existingUsers && existingUsers.length > 0) {
    userId = existingUsers[0].id;
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

    await supabase
      .from('animations')
      .update(updateData)
      .eq('id', animationId);
  }

  // Create purchase record
  await supabase.from('purchases').insert({
    user_id: userId,
    animation_id: isRealAnimation ? animationId : null,
    stripe_session_id: session.id,
    product_type: productType || 'single',
    amount: session.amount_total || 0,
  });

  // Update user profile with Stripe customer ID and subscription status
  if (userId && customerId) {
    const profileUpdate: Record<string, unknown> = {
      stripe_customer_id: customerId,
    };

    if (productType === 'subscription') {
      profileUpdate.subscription_status = 'trial';
    } else if (productType === 'bundle') {
      // Add 10 credits for bundle purchase
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      
      profileUpdate.credits = (profile?.credits || 0) + 10;
    } else if (productType === 'single' && !isRealAnimation) {
      // Add 1 credit for single purchase if not tied to an animation
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();
      
      profileUpdate.credits = (profile?.credits || 0) + 1;
    }

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);
  }

  // If we have a guest session but no user yet, 
  // the data will be promoted when they click the magic link
  if (guestSessionId && !userId) {
    console.log('Guest purchase - awaiting auth:', { guestSessionId, animationId });
  }

  console.log('Checkout complete:', { animationId, productType, userId });
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

