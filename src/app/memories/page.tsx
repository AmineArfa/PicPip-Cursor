import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MemoriesContent } from './memories-content';
import type { Animation, Profile } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface MemoriesData {
  user: { id: string; email?: string } | null;
  animations: Animation[];
  profile: Profile | null;
}

async function getMemoriesData(): Promise<MemoriesData> {
  const supabase = await createServerSupabaseClient();
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, animations: [], profile: null };
  }
  
  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get user's animations
  const { data: animations } = await supabase
    .from('animations')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false });
  
  return { 
    user: { id: user.id, email: user.email }, 
    animations: (animations || []) as Animation[], 
    profile: profile as Profile | null 
  };
}

export default async function MemoriesPage() {
  const { user, animations, profile } = await getMemoriesData();
  
  if (!user) {
    redirect('/');
  }
  
  const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'trial';
  
  return (
    <Suspense fallback={<MemoriesLoading />}>
      <MemoriesContent 
        animations={animations} 
        profile={profile} 
        isSubscribed={isSubscribed}
      />
    </Suspense>
  );
}

function MemoriesLoading() {
  return (
    <div className="min-h-screen bg-[#fffde7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
