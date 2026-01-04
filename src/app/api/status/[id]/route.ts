import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createServerSupabaseClient } from '@/lib/supabase/server';
import { devStore } from '@/lib/dev-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: animationId } = await params;

    if (!animationId) {
      return NextResponse.json(
        { error: 'Animation ID required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated and has access
    let userId: string | null = null;
    let isSubscribed = false;
    
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        userId = user.id;
        
        // Check subscription status
        const serviceSupabase = await createServiceRoleClient();
        const { data: profile } = await serviceSupabase
          .from('profiles')
          .select('subscription_status')
          .eq('id', user.id)
          .single();
        
        isSubscribed = profile?.subscription_status === 'active' || 
                       profile?.subscription_status === 'trial';
      }
    } catch (authError) {
      // User not authenticated, continue as guest
    }

    // First check dev store (for development mode)
    const devAnimation = devStore.getAnimation(animationId);
    if (devAnimation) {
      // For dev mode, still apply security - hide video_url if not paid
      return NextResponse.json(sanitizeAnimation(devAnimation as unknown as Record<string, unknown>, userId, isSubscribed));
    }

    // Try Supabase
    try {
      const supabase = await createServiceRoleClient();

      const { data: animation, error } = await supabase
        .from('animations')
        .select('*')
        .eq('id', animationId)
        .single();

      if (error || !animation) {
        return NextResponse.json(
          { error: 'Animation not found' },
          { status: 404 }
        );
      }

      // Sanitize the response - only return video_url if user has access
      return NextResponse.json(sanitizeAnimation(animation, userId, isSubscribed));
    } catch (supabaseError: any) {
      console.warn('Supabase not available:', supabaseError.message);
      return NextResponse.json(
        { error: 'Animation not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Sanitize animation data based on user access
 * Only return unwatermarked video_url if:
 * - Animation is paid, OR
 * - User is the owner and has active subscription
 */
function sanitizeAnimation(
  animation: Record<string, unknown>,
  userId: string | null,
  isSubscribed: boolean
): Record<string, unknown> {
  const isPaid = animation.is_paid === true;
  const isOwner = userId && animation.user_id === userId;
  
  // User can access unwatermarked video if:
  // 1. Animation is paid, OR
  // 2. User is the owner AND has active subscription
  const canAccessUnwatermarked = isPaid || (isOwner && isSubscribed);
  
  if (canAccessUnwatermarked) {
    // Return full animation data
    return animation;
  }
  
  // Hide the unwatermarked video URL for unpaid animations
  return {
    ...animation,
    video_url: null, // Hide unwatermarked URL
    // Keep watermarked URL for preview
  };
}
