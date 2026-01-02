'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  CreditCard, 
  LogOut, 
  Settings,
  ImageIcon,
  Crown,
  Sparkles
} from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton, NeoCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AccountContentProps {
  user: SupabaseUser;
  profile: Profile | null;
  stats: {
    totalAnimations: number;
    paidAnimations: number;
  } | null;
}

export function AccountContent({ user, profile, stats }: AccountContentProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const isSubscribed = profile?.subscription_status === 'active' || 
                       profile?.subscription_status === 'trial';

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const handleManageSubscription = () => {
    // In production, redirect to Stripe Customer Portal
    window.open('https://billing.stripe.com/p/login/test', '_blank');
  };

  return (
    <DotPattern className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} isSubscribed={isSubscribed} />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#ff61d2] to-[#2962ff] border-4 border-[#181016] flex items-center justify-center shadow-[6px_6px_0_0_#181016]">
              <User className="w-12 h-12 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-[#181016]">
              My Account
            </h1>
            <p className="text-[#181016]/60 mt-1">{user.email}</p>
          </motion.div>

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <NeoCard 
              variant={isSubscribed ? 'primary' : 'default'} 
              hover={false}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                {isSubscribed ? (
                  <Crown className="w-8 h-8 text-yellow-300" />
                ) : (
                  <Sparkles className="w-8 h-8 text-[#ff61d2]" />
                )}
                <h2 className={`font-display text-2xl font-bold ${isSubscribed ? 'text-white' : 'text-[#181016]'}`}>
                  {isSubscribed ? 'Unlimited Magic Active' : 'Free Plan'}
                </h2>
              </div>
              
              {isSubscribed ? (
                <div className="space-y-4">
                  <p className="text-white/80">
                    You have unlimited access to all PicPip features!
                  </p>
                  <NeoButton
                    variant="white"
                    size="md"
                    icon={<CreditCard className="w-5 h-5" />}
                    onClick={handleManageSubscription}
                  >
                    Manage Subscription
                  </NeoButton>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[#181016]/70">
                    {profile?.credits || 0} credits remaining
                  </p>
                  <NeoButton
                    variant="primary"
                    size="md"
                    icon={<Sparkles className="w-5 h-5" />}
                    onClick={() => router.push('/pricing')}
                  >
                    Upgrade to Unlimited
                  </NeoButton>
                </div>
              )}
            </NeoCard>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-4"
          >
            <NeoCard hover={false} className="text-center">
              <ImageIcon className="w-8 h-8 mx-auto mb-2 text-[#2962ff]" />
              <p className="font-display text-3xl font-bold text-[#181016]">
                {stats?.totalAnimations || 0}
              </p>
              <p className="text-sm text-[#181016]/60 font-medium">
                Total Memories
              </p>
            </NeoCard>
            <NeoCard hover={false} className="text-center">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-[#a3ff00]" />
              <p className="font-display text-3xl font-bold text-[#181016]">
                {profile?.credits || 0}
              </p>
              <p className="text-sm text-[#181016]/60 font-medium">
                Credits Left
              </p>
            </NeoCard>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <NeoCard hover={false}>
              <h3 className="font-display text-xl font-bold text-[#181016] mb-4">
                Account Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[#fffde7] rounded-xl">
                  <Mail className="w-5 h-5 text-[#181016]/60" />
                  <div>
                    <p className="text-sm text-[#181016]/60">Email</p>
                    <p className="font-medium text-[#181016]">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#fffde7] rounded-xl">
                  <Settings className="w-5 h-5 text-[#181016]/60" />
                  <div>
                    <p className="text-sm text-[#181016]/60">Account Status</p>
                    <p className="font-medium text-[#181016] capitalize">
                      {profile?.subscription_status || 'Free'}
                    </p>
                  </div>
                </div>
              </div>
            </NeoCard>
          </motion.div>

          {/* Sign Out */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <NeoButton
              variant="white"
              size="lg"
              icon={<LogOut className="w-5 h-5" />}
              onClick={handleSignOut}
              disabled={isLoggingOut}
              className="border-red-300"
            >
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </NeoButton>
          </motion.div>
        </div>
      </main>
    </DotPattern>
  );
}

