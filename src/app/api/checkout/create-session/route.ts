import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, type ProductType } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productType, customerEmail, animationId, guestSessionId } = body;

    // Validate required fields
    if (!productType || !customerEmail || !animationId) {
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

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      productType: productType as ProductType,
      customerEmail,
      animationId,
      guestSessionId: guestSessionId || '',
      successUrl: `${baseUrl}/celebration/${animationId}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/checkout/${animationId}`,
    });

    // Also trigger magic link auth (non-blocking)
    if (guestSessionId) {
      triggerMagicLink(customerEmail, guestSessionId, animationId).catch((err) => {
        console.error('Magic link error:', err);
      });
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Send magic link for authentication
async function triggerMagicLink(
  email: string,
  guestSessionId: string,
  animationId: string
) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?guestSessionId=${guestSessionId}&animationId=${animationId}`,
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

