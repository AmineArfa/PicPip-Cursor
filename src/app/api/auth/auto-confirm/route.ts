import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Auto-confirm user email in development mode
 * This bypasses email confirmation for testing purposes
 * ONLY works in development/localhost
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Auto-confirm is only available in development' },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    // Update user to confirm email using admin API
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      }
    );

    if (error) {
      console.error('Auto-confirm error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Auto-confirm error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-confirm user' },
      { status: 500 }
    );
  }
}

