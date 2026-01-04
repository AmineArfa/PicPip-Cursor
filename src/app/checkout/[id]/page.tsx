'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Star, Users, Check, Shield, Apple, Sparkles, CreditCard, Zap, LogIn } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton, NeoCard, NeoInput } from '@/components/ui';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

type PlanType = 'trial' | 'single' | 'bundle';
type CheckoutMode = 'loading' | 'logged_in' | 'guest_email' | 'guest_payment';

const PLANS = {
  trial: {
    name: '7 Days Free',
    subtitle: 'then $9.99/mo',
    price: 'Free',
    priceSuperscript: '+',
    description: 'Unlimited Animations',
    buttonText: 'Start Trial',
    variant: 'primary' as const,
    badge: { text: 'Best Value', icon: <Star className="w-4 h-4" /> },
    productType: 'subscription' as const,
  },
  single: {
    name: 'Just this one',
    subtitle: 'One-time payment',
    price: '$4.99',
    priceSuperscript: '',
    description: 'Single HD Download',
    buttonText: 'Buy One',
    variant: 'cyan' as const,
    productType: 'single' as const,
  },
  bundle: {
    name: 'Bundle Pack',
    subtitle: '10 Photos',
    price: '$19.99',
    priceSuperscript: '',
    description: 'Save 60% instantly',
    buttonText: 'Buy Bundle',
    variant: 'lime' as const,
    badge: { text: 'Best For Family', icon: <Users className="w-4 h-4" /> },
    productType: 'bundle' as const,
  },
};

function CheckoutContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const animationId = params.id as string;
  const returnFromLogin = searchParams.get('from_login') === 'true';
  
  const [mode, setMode] = useState<CheckoutMode>('loading');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('trial');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isUsingCredit, setIsUsingCredit] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); // Store auth email as fallback
  
  const { guestSessionId, setCredits, setUserState } = usePicPipStore();

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email || null); // Store auth email
        
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const typedProfile = profileData as Profile | null;
        if (typedProfile) {
          setProfile(typedProfile);
          // Update global store with user state
          const isSubscribed = typedProfile.subscription_status === 'active' || 
                               typedProfile.subscription_status === 'trial';
          setUserState(true, isSubscribed, typedProfile.credits || 0);
        }
        setMode('logged_in');
      } else {
        setMode('guest_email');
      }
    }
    
    checkAuth();
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const hasCredits = profile && (
    profile.credits > 0 || 
    profile.subscription_status === 'active' || 
    profile.subscription_status === 'trial'
  );

  const handleUseCredit = async () => {
    if (!hasCredits) return;
    
    setIsUsingCredit(true);
    
    try {
      const response = await fetch('/api/checkout/use-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animationId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to use credit');
      }

      // Update the global store with new credit count
      if (typeof data.credits === 'number') {
        setCredits(data.credits);
      }

      // Success! Redirect to celebration page
      router.push(`/celebration/${animationId}`);
    } catch (error: any) {
      console.error('Use credit error:', error);
      setEmailError(error.message || 'Failed to use credit. Please try again.');
    } finally {
      setIsUsingCredit(false);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) {
      setEmailError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError(null);
    setIsCheckingEmail(true);

    try {
      // Check if email exists in system
      const response = await fetch('/api/checkout/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check email');
      }

      if (data.exists) {
        // Email exists - redirect to login with return URL
        const returnUrl = encodeURIComponent(`/checkout/${animationId}?from_login=true`);
        router.push(`/login?redirect=${returnUrl}`);
      } else {
        // Email doesn't exist - proceed to payment options
        setMode('guest_payment');
      }
    } catch (error: any) {
      console.error('Email check error:', error);
      setEmailError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleCheckout = async (planType: PlanType) => {
    // For logged-in users, use email from profile or auth session as fallback
    const customerEmail = mode === 'logged_in' 
      ? (profile?.email || userEmail) 
      : email;
    
    if (!customerEmail) {
      setEmailError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(customerEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setEmailError(null);
    setIsLoading(true);
    setSelectedPlan(planType);

    try {
      // Create checkout session
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: PLANS[planType].productType,
          customerEmail,
          animationId,
          guestSessionId,
          userId, // Include user ID if logged in
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = data;

      // Redirect to Stripe Checkout
      if (url) {
        window.location.href = url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setEmailError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate subscription status
  const isSubscribed = profile?.subscription_status === 'active' || profile?.subscription_status === 'trial';
  const isAuthenticated = mode === 'logged_in' && userId !== null;

  // Loading state
  if (mode === 'loading') {
    return (
      <DotPattern variant="dense" className="min-h-screen flex flex-col">
        <Header 
          step={{ current: 3, total: 3 }}
          isAuthenticated={false}
          isSubscribed={false}
          credits={0}
        />
        <main className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full"
          />
        </main>
      </DotPattern>
    );
  }

  return (
    <DotPattern variant="dense" className="min-h-screen flex flex-col">
      <Header 
        step={{ current: 3, total: 3 }}
        isAuthenticated={isAuthenticated}
        isSubscribed={isSubscribed}
        credits={profile?.credits || 0}
      />

      <main className="flex-1 py-8 sm:py-12 px-4">
        <div className="max-w-[1080px] mx-auto space-y-10">
          {/* Headline Section */}
          <motion.div
            className="text-center space-y-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white border-4 border-[#181016] shadow-[6px_6px_0_0_#181016] mb-4">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#181016]">
              Your video is ready!
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-[#181016]/80">
              It looks amazing. Let&apos;s get it to you.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {/* LOGGED IN: Show Credits + Buy More Options */}
            {mode === 'logged_in' && (
              <motion.div
                key="logged-in"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Credit Status Card */}
                <div className="max-w-2xl mx-auto">
                  <NeoCard variant="default" className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#ff61d2] border-3 border-[#181016] flex items-center justify-center">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-[#181016]">Welcome back!</p>
                          <p className="text-sm text-[#181016]/60">{profile?.email || userEmail}</p>
                        </div>
                      </div>
                      {profile?.subscription_status === 'active' || profile?.subscription_status === 'trial' ? (
                        <div className="bg-[#a3ff00] border-2 border-[#181016] rounded-full px-4 py-2">
                          <span className="font-bold text-[#181016]">
                            ✨ {profile.subscription_status === 'trial' ? 'Trial' : 'Subscribed'}
                          </span>
                        </div>
                      ) : (
                        <div className="bg-white border-2 border-[#181016] rounded-full px-4 py-2">
                          <span className="font-bold text-[#181016]">
                            {profile?.credits || 0} credit{(profile?.credits || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {hasCredits ? (
                      <div className="space-y-4">
                        <div className="bg-[#E8F4FD] border-2 border-[#181016]/10 rounded-xl p-4">
                          <p className="text-[#181016] font-medium flex items-center gap-2">
                            <Zap className="w-5 h-5 text-[#ff61d2]" />
                            {profile?.subscription_status === 'active' || profile?.subscription_status === 'trial'
                              ? 'Your subscription includes unlimited animations!'
                              : `Use 1 credit to unlock this animation. You have ${profile?.credits} credit${(profile?.credits || 0) !== 1 ? 's' : ''}.`
                            }
                          </p>
                        </div>
                        
                        <NeoButton
                          variant="primary"
                          size="lg"
                          icon={<Sparkles className="w-6 h-6" />}
                          onClick={handleUseCredit}
                          disabled={isUsingCredit}
                          className="w-full"
                        >
                          {isUsingCredit ? 'Unlocking...' : 'Use Credit & Download'}
                        </NeoButton>
                      </div>
                    ) : (
                      <div className="bg-[#FFF9E6] border-2 border-[#181016]/10 rounded-xl p-4">
                        <p className="text-[#181016] font-medium">
                          You&apos;re out of credits! Choose a plan below to unlock your video.
                        </p>
                      </div>
                    )}

                    {emailError && (
                      <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-3">
                        <p className="text-red-600 text-sm font-medium">{emailError}</p>
                      </div>
                    )}
                  </NeoCard>
                </div>

                {/* Divider for Buy More */}
                {hasCredits && (
                  <div className="flex items-center gap-4 max-w-2xl mx-auto">
                    <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
                    <span className="text-[#181016]/50 font-bold">or get more credits</span>
                    <div className="flex-1 h-1 bg-[#181016]/10 rounded-full" />
                  </div>
                )}

                {/* Pricing Cards for Logged In Users */}
                <PricingCards
                  onCheckout={handleCheckout}
                  isLoading={isLoading}
                  selectedPlan={selectedPlan}
                  showTitle={!hasCredits}
                />
              </motion.div>
            )}

            {/* GUEST: Email Input */}
            {mode === 'guest_email' && (
              <motion.div
                key="guest-email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                <NeoInput
                  type="email"
                  size="xl"
                  placeholder="Enter your email here..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  error={emailError || undefined}
                  label="Where should we send your video?"
                  icon={<Mail className="w-8 h-8" />}
                />

                <NeoButton
                  variant="primary"
                  size="lg"
                  icon={isCheckingEmail ? undefined : <Sparkles className="w-6 h-6" />}
                  onClick={handleEmailSubmit}
                  disabled={isCheckingEmail || !email}
                  className="w-full"
                >
                  {isCheckingEmail ? 'Checking...' : 'Continue'}
                </NeoButton>

                <div className="text-center">
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent(`/checkout/${animationId}?from_login=true`)}`)}
                    className="text-[#2962ff] font-bold hover:underline inline-flex items-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Already have an account? Sign in
                  </button>
                </div>
              </motion.div>
            )}

            {/* GUEST: Payment Options (email doesn't exist) */}
            {mode === 'guest_payment' && (
              <motion.div
                key="guest-payment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Email confirmation */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border-4 border-[#181016] rounded-2xl shadow-[6px_6px_0_0_#181016] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-6 h-6 text-[#ff61d2]" />
                      <div>
                        <p className="font-bold text-[#181016]">Sending to:</p>
                        <p className="text-[#181016]/70">{email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMode('guest_email')}
                      className="text-[#2962ff] font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Pricing Cards */}
                <PricingCards
                  onCheckout={handleCheckout}
                  isLoading={isLoading}
                  selectedPlan={selectedPlan}
                  showTitle={true}
                />

                {/* Account creation note */}
                <motion.div
                  className="max-w-2xl mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-[#E8F4FD] border-2 border-[#181016]/10 rounded-xl p-4 text-center">
                    <p className="text-[#181016]/70 font-medium">
                      💡 After payment, you&apos;ll create an account to save and access all your memories!
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Payment Methods & Trust (shown for all payment modes) */}
          {(mode === 'guest_payment' || (mode === 'logged_in' && !hasCredits)) && (
            <motion.div
              className="max-w-2xl mx-auto space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Payment Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="flex-1 min-w-[200px] h-16 bg-black text-white border-4 border-[#181016] rounded-full shadow-[6px_6px_0_0_#181016] flex items-center justify-center gap-3 hover:bg-gray-900 transition-all active:translate-y-1 active:shadow-none"
                  disabled
                >
                  <Apple className="w-8 h-8" />
                  <span className="text-2xl font-bold tracking-tight">Pay</span>
                </button>
                <button
                  className="flex-1 min-w-[200px] h-16 bg-white text-[#181016] border-4 border-[#181016] rounded-full shadow-[6px_6px_0_0_#181016] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:translate-y-1 active:shadow-none"
                  disabled
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-2xl font-bold tracking-tight">Pay</span>
                </button>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center justify-center gap-3 bg-white/60 backdrop-blur-sm border-2 border-[#181016]/10 px-6 py-3 rounded-full mx-auto w-fit">
                <Shield className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <span className="text-lg font-black uppercase text-[#181016] block leading-none">
                    100% Safe & Secure
                  </span>
                  <span className="text-sm font-bold text-[#181016]/60 leading-none mt-1 block">
                    Encrypted Checkout
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center text-[#181016]/50 font-bold text-sm">
        <p>© 2024 PicPip.co. All memories preserved.</p>
      </footer>
    </DotPattern>
  );
}

// Extracted Pricing Cards component for reuse
function PricingCards({
  onCheckout,
  isLoading,
  selectedPlan,
  showTitle = true,
}: {
  onCheckout: (plan: PlanType) => void;
  isLoading: boolean;
  selectedPlan: PlanType;
  showTitle?: boolean;
}) {
  return (
    <motion.div
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Trial Card */}
      <NeoCard
        variant="primary"
        badge={PLANS.trial.badge}
        className="text-center mt-4"
        hover={false}
      >
        <div className="flex flex-col gap-4 flex-1 items-center mt-4">
          <h3 className="text-2xl font-extrabold text-white drop-shadow-md">
            {PLANS.trial.name}
          </h3>
          <div className="bg-white/20 rounded-xl p-2 w-full">
            <p className="text-[#181016] font-bold text-lg">{PLANS.trial.subtitle}</p>
          </div>
          <p className="text-[#181016] text-5xl font-black tracking-tighter my-2">
            {PLANS.trial.price}
            <span className="text-2xl align-top text-white">{PLANS.trial.priceSuperscript}</span>
          </p>
          <p className="text-white font-bold text-lg">{PLANS.trial.description}</p>
        </div>
        <div className="mt-6">
          <NeoButton
            variant="white"
            size="lg"
            onClick={() => onCheckout('trial')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && selectedPlan === 'trial' ? 'Loading...' : PLANS.trial.buttonText}
          </NeoButton>
        </div>
      </NeoCard>

      {/* Single Card */}
      <NeoCard
        variant="cyan"
        className="text-center lg:mt-6"
        hover={false}
      >
        <div className="flex flex-col gap-4 flex-1 items-center">
          <h3 className="text-2xl font-extrabold text-[#181016]">
            {PLANS.single.name}
          </h3>
          <div className="bg-white/40 rounded-xl p-2 w-full">
            <p className="text-[#181016] font-bold text-lg">{PLANS.single.subtitle}</p>
          </div>
          <p className="text-[#181016] text-5xl font-black tracking-tighter my-2">
            {PLANS.single.price}
          </p>
          <p className="text-[#181016]/70 font-bold text-lg">{PLANS.single.description}</p>
        </div>
        <div className="mt-6">
          <NeoButton
            variant="white"
            size="lg"
            onClick={() => onCheckout('single')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && selectedPlan === 'single' ? 'Loading...' : PLANS.single.buttonText}
          </NeoButton>
        </div>
      </NeoCard>

      {/* Bundle Card */}
      <NeoCard
        variant="lime"
        badge={PLANS.bundle.badge}
        className="text-center mt-4 lg:mt-2"
        hover={false}
      >
        <div className="flex flex-col gap-4 flex-1 items-center mt-4">
          <h3 className="text-2xl font-extrabold text-[#181016]">
            {PLANS.bundle.name}
          </h3>
          <div className="bg-white/40 rounded-xl p-2 w-full">
            <p className="text-[#181016] font-bold text-lg">{PLANS.bundle.subtitle}</p>
          </div>
          <p className="text-[#181016] text-5xl font-black tracking-tighter my-2">
            {PLANS.bundle.price}
          </p>
          <p className="text-[#181016]/70 font-bold text-lg">{PLANS.bundle.description}</p>
        </div>
        <div className="mt-6">
          <NeoButton
            variant="white"
            size="lg"
            onClick={() => onCheckout('bundle')}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading && selectedPlan === 'bundle' ? 'Loading...' : PLANS.bundle.buttonText}
          </NeoButton>
        </div>
      </NeoCard>
    </motion.div>
  );
}

function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
