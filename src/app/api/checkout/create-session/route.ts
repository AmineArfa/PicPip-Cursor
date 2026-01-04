import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, type ProductType } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productType, customerEmail, animationId, guestSessionId } = body;

    // animationId is optional for all products now (to allow buying credits)
    // but still good to have it if available
    if (!productType || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate product type
    if (!['single', 'bundle', 'subscription'].includes(productType)) {
      return NextResponse.json(
        { error: 'Invalid product type' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get base URL - prioritize the request origin for correct redirects
    const origin = request.nextUrl.origin;
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://picpip.co';

    // Check if user is logged in and get their ID
    let userId: string | undefined;
    let isLoggedIn = false;
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        isLoggedIn = true;
      }
    } catch (e) {
      // User might not be logged in (guest checkout)
      console.log('No user session for checkout');
    }

    // Determine success and cancel URLs based on product type
    let successUrl: string;
    let cancelUrl: string;

    const isCreditsOnly = animationId === 'credits-only' || animationId === 'pricing-page';

    if (productType === 'subscription' || isCreditsOnly) {
      // For subscriptions or credit-only purchases, redirect to account
      successUrl = `${baseUrl}/account?session_id={CHECKOUT_SESSION_ID}${isCreditsOnly ? '&credits_purchased=true' : ''}`;
      cancelUrl = `${baseUrl}/pricing`;
    } else {
      // For single/bundle tied to an animation, redirect to celebration page
      // Include email for account creation prompt if guest user
      const emailParam = !isLoggedIn ? `&email=${encodeURIComponent(customerEmail)}&create_account=true` : '';
      successUrl = `${baseUrl}/celebration/${animationId}?session_id={CHECKOUT_SESSION_ID}${emailParam}`;
      cancelUrl = `${baseUrl}/checkout/${animationId}`;
    }

    // Create Stripe checkout session
    try {
      const session = await createCheckoutSession({
        productType: productType as ProductType,
        customerEmail,
        animationId: animationId || 'pricing-page',
        guestSessionId: guestSessionId || '',
        userId: userId || '',
        successUrl,
        cancelUrl,
      });

      // Also trigger magic link auth (non-blocking)
      if (guestSessionId) {
        triggerMagicLink(customerEmail, guestSessionId, animationId, baseUrl).catch((err) => {
          console.error('Magic link error:', err);
        });
      }

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (stripeError: any) {
      console.error('Stripe session creation error:', stripeError);
      
      // Return more specific error message if it's a configuration issue
      if (stripeError.message?.includes('not configured')) {
        return NextResponse.json(
          { error: stripeError.message },
          { status: 500 }
        );
      }
      
      throw stripeError; // Re-throw for the general catch block
    }
  } catch (error: any) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Send magic link for authentication
async function triggerMagicLink(
  email: string,
  guestSessionId: string,
  animationId: string,
  baseUrl: string
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${baseUrl}/auth/callback?guestSessionId=${guestSessionId}&animationId=${animationId}`,
        data: {
          guestSessionId,
          animationId,
        },
      },
    });

    if (error) {
      console.error('Magic link error:', error);
    }
  } catch (error) {
    console.error('Failed to send magic link:', error);
  }
}

