import { createServerSupabaseClient, createServiceRoleClient } from './supabase/server';

/**
 * Check if the current user is an admin
 * @returns Object with isAdmin boolean and userId (if authenticated)
 */
export async function checkAdminAccess() {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { isAdmin: false, userId: null, error: userError?.message || 'Not authenticated' };
    }

    // Use service role client to check profile (bypasses RLS)
    const serviceClient = await createServiceRoleClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { isAdmin: false, userId: user.id, error: profileError?.message || 'Profile not found' };
    }

    return { 
      isAdmin: profile.is_admin === true, 
      userId: user.id,
      error: null 
    };
  } catch (error: any) {
    console.error('Error checking admin access:', error);
    return { isAdmin: false, userId: null, error: error.message };
  }
}

/**
 * Get admin user ID from request (for API routes)
 * Returns null if user is not an admin
 */
export async function getAdminUserId(): Promise<string | null> {
  const { isAdmin, userId } = await checkAdminAccess();
  return isAdmin ? userId : null;
}

