import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const guestSessionId = requestUrl.searchParams.get('guestSessionId');
  const animationId = requestUrl.searchParams.get('animationId');
  const next = requestUrl.searchParams.get('next');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = await createServerSupabaseClient();
    
    // Exchange the code for a session
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }

    if (user && guestSessionId) {
      // Promote guest data to authenticated user
      await promoteGuestToUser(guestSessionId, user.id, user.email || undefined);
    }

    // Redirect to the animation or memories page
    if (animationId) {
      return NextResponse.redirect(new URL(`/celebration/${animationId}`, request.url));
    }
    
    // Determine where to redirect next
    let redirectTo = '/memories';
    
    if (next) {
      redirectTo = decodeURIComponent(next);
    } else if (type === 'recovery') {
      redirectTo = '/auth/reset-password';
    }
    
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // No code, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}

async function promoteGuestToUser(
  guestSessionId: string,
  userId: string,
  email?: string
) {
  try {
    const supabase = await createServiceRoleClient();

    // Update animations to associate with user
    const { data: animations, error: animationsError } = await supabase
      .from('animations')
      .update({
        user_id: userId,
        guest_session_id: null,
      })
      .eq('guest_session_id', guestSessionId)
      .select();

    if (animationsError) {
      console.error('Error promoting animations:', animationsError);
    } else {
      console.log(`Promoted ${animations?.length || 0} animations to user ${userId}`);
    }

    // Update purchases to associate with user
    const { error: purchasesError } = await supabase
      .from('purchases')
      .update({ user_id: userId })
      .is('user_id', null)
      .in('animation_id', (animations || []).map(a => a.id));

    if (purchasesError) {
      console.error('Error promoting purchases:', purchasesError);
    }

    // Update profile email if not set
    if (email) {
      await supabase
        .from('profiles')
        .update({ email })
        .eq('id', userId)
        .is('email', null);
    }

  } catch (error) {
    console.error('Error in promoteGuestToUser:', error);
  }
}

