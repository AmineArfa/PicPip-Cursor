import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Check if an email exists in the system and return basic info
 * Used in checkout flow to determine if user should login or register
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Check if a user exists with this email
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, credits, subscription_status')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (error) {
      console.error('Error checking email:', error);
      return NextResponse.json(
        { error: 'Failed to check email' },
        { status: 500 }
      );
    }

    const exists = profiles && profiles.length > 0;
    
    return NextResponse.json({
      exists,
      // Don't expose sensitive info to unauthenticated users
      // Just tell them they need to login
    });
  } catch (error: any) {
    console.error('Check email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check email' },
      { status: 500 }
    );
  }
}

