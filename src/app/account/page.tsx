import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AccountContent } from './account-content';

function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export const dynamic = 'force-dynamic';

async function getAccountData() {
  const supabase = await createServerSupabaseClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { user: null, profile: null, stats: null };
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get animation stats
  const { count: totalAnimations } = await supabase
    .from('animations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);
  
  const { count: paidAnimations } = await supabase
    .from('animations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_paid', true);
  
  return {
    user,
    profile,
    stats: {
      totalAnimations: totalAnimations || 0,
      paidAnimations: paidAnimations || 0,
    },
  };
}

export default async function AccountPage() {
  const { user, profile, stats } = await getAccountData();
  
  if (!user) {
    redirect('/');
  }
  
  return (
    <Suspense fallback={<AccountLoading />}>
      <AccountContent user={user} profile={profile} stats={stats} />
    </Suspense>
  );
}

