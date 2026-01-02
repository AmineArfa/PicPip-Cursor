import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AccountContent } from './account-content';

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
  
  return <AccountContent user={user} profile={profile} stats={stats} />;
}

