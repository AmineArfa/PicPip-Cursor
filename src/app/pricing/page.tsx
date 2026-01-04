'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Package, Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DotPattern, NeoButton, NeoCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

type PlanType = 'single' | 'bundle' | 'subscription';

const PLANS = {
  subscription: {
    name: 'Unlimited Magic',
    subtitle: '7 days free, then $9.99/month',
    price: 'Free',
    priceSuperscript: '+',
    description: 'Start with 7-day trial',
    buttonText: 'Start Free Trial',
    variant: 'primary' as const,
    badge: { text: 'Best Value', icon: <Star className="w-4 h-4" /> },
    productType: 'subscription' as const,
    features: [
      { text: 'Unlimited Fast videos', highlight: true },
      { text: '5 High Quality videos/day', highlight: true },
      { text: 'All video formats (TikTok, Reels, YouTube)', highlight: false },
      { text: 'HD video downloads', highlight: false },
      { text: 'No watermarks', highlight: false },
      { text: 'Cancel anytime', highlight: false },
    ],
  },
  bundle: {
    name: 'Credit Bundle',
    subtitle: '20 Credits',
    price: '$19.99',
    priceSuperscript: '',
    description: 'Best value for credits',
    buttonText: 'Buy Bundle',
    variant: 'lime' as const,
    badge: { text: 'Save 60%', icon: <Package className="w-4 h-4" /> },
    productType: 'bundle' as const,
    features: [
      { text: '20 credits included', highlight: true },
      { text: '20 Fast videos OR 10 High Quality', highlight: true },
      { text: 'All video formats', highlight: false },
      { text: 'HD video downloads', highlight: false },
      { text: 'No expiration', highlight: false },
      { text: 'One-time payment', highlight: false },
    ],
  },
  single: {
    name: 'Starter Pack',
    subtitle: '2 Credits',
    price: '$4.99',
    priceSuperscript: '',
    description: 'Perfect to try it out',
    buttonText: 'Get Started',
    variant: 'cyan' as const,
    productType: 'single' as const,
    features: [
      { text: '2 credits included', highlight: true },
      { text: '2 Fast videos OR 1 High Quality', highlight: true },
      { text: 'All video formats', highlight: false },
      { text: 'HD video downloads', highlight: false },
      { text: 'No watermarks', highlight: false },
      { text: 'One-time payment', highlight: false },
    ],
  },
};

export default function PricingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        // Check subscription status and credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const typedProfile = profile as Profile | null;
        if (typedProfile?.subscription_status === 'active' || typedProfile?.subscription_status === 'trial') {
          setIsSubscribed(true);
        }
        setCredits(typedProfile?.credits || 0);
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  const handleSelectPlan = async (planType: PlanType) => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/pricing`);
      return;
    }

    if (isSubscribed && planType === 'subscription') {
      router.push('/account');
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        router.push('/account');
        return;
      }

      // Create checkout session directly for all plan types
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productType: planType,
          customerEmail: user.email,
          animationId: 'credits-only', // Special ID for credit-only purchases
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = data;
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      // Fallback to account page
      router.push('/account');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DotPattern variant="dense" className="min-h-screen flex flex-col">
      <Header isAuthenticated={isAuthenticated} isSubscribed={isSubscribed} credits={credits} />
      
      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold text-[#181016] mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl md:text-2xl text-[#181016]/70 max-w-2xl mx-auto mb-6">
              Bring your memories to life with our flexible pricing options
            </p>
            
            {/* Quality Explainer */}
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl border-3 border-[#181016] shadow-[4px_4px_0_0_#181016] p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#00d4ff]" />
                <span className="font-bold">Fast</span>
                <span className="text-[#181016]/60">= 1 credit</span>
              </div>
              <div className="hidden sm:block w-px h-6 bg-[#181016]/20" />
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#ff61d2]" />
                <span className="font-bold">High Quality</span>
                <span className="text-[#181016]/60">= 2 credits</span>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {Object.entries(PLANS).map(([key, plan]) => {
              const planKey = key as PlanType;
              const isRecommended = planKey === 'subscription';
              const isDisabled = isSubscribed && planKey === 'subscription';

              return (
                <motion.div
                  key={planKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: planKey === 'single' ? 0.1 : planKey === 'bundle' ? 0.2 : 0.3 }}
                  className={isRecommended ? 'md:-mt-4' : ''}
                >
                  <NeoCard
                    variant={plan.variant}
                    badge={'badge' in plan ? plan.badge : undefined}
                    hover={!isDisabled}
                    className={isDisabled ? 'opacity-60' : ''}
                  >
                    <div className="flex flex-col h-full">
                      {/* Plan Name */}
                      <h3 className="font-display text-2xl md:text-3xl font-bold text-[#181016] mb-2">
                        {plan.name}
                      </h3>
                      <p className="text-[#181016]/70 mb-4">{plan.subtitle}</p>

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-5xl md:text-6xl font-black text-[#181016]">
                            {plan.price}
                          </span>
                          {plan.priceSuperscript && (
                            <span className="text-xl font-bold text-[#181016]/70">
                              {plan.priceSuperscript}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#181016]/60 mt-1">{plan.description}</p>
                      </div>

                      {/* Features */}
                      <ul className="flex-1 space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-[#ff61d2]' : 'text-[#181016]'}`} />
                            <span className={feature.highlight ? 'text-[#181016] font-bold' : 'text-[#181016]/80'}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <NeoButton
                        variant={plan.variant === 'primary' ? 'primary' : plan.variant === 'lime' ? 'lime' : 'cyan'}
                        size="lg"
                        icon={<Sparkles className="w-5 h-5" />}
                        iconPosition="left"
                        onClick={() => handleSelectPlan(planKey)}
                        disabled={isDisabled}
                        className="w-full"
                      >
                        {isDisabled ? 'Current Plan' : plan.buttonText}
                      </NeoButton>
                    </div>
                  </NeoCard>
                </motion.div>
              );
            })}
          </div>

          {/* Quality Comparison */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 mb-12"
          >
            <h2 className="font-display text-2xl font-bold text-[#181016] mb-6 text-center">
              Fast vs. High Quality
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Fast */}
              <div className="bg-[#00d4ff]/10 rounded-2xl p-6 border-3 border-[#00d4ff]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#00d4ff] border-3 border-[#181016] flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Fast Mode</h3>
                    <p className="text-sm text-[#181016]/60">1 credit per video</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>~30 second generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Great for quick previews</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Good motion quality</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#00d4ff]" />
                    <span>Unlimited for subscribers</span>
                  </li>
                </ul>
              </div>

              {/* High Quality */}
              <div className="bg-[#ff61d2]/10 rounded-2xl p-6 border-3 border-[#ff61d2]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#ff61d2] border-3 border-[#181016] flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">High Quality Mode</h3>
                    <p className="text-sm text-[#181016]/60">2 credits per video</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#ff61d2]" />
                    <span>~2 minute generation</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#ff61d2]" />
                    <span>Best for sharing & posting</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#ff61d2]" />
                    <span>Enhanced motion & details</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[#ff61d2]" />
                    <span>5/day for subscribers</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[6px_6px_0_0_#181016] p-8 text-center"
          >
            <h2 className="font-display text-2xl font-bold text-[#181016] mb-4">
              All Plans Include
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#ff61d2] border-4 border-[#181016] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">HD Quality</h3>
                <p className="text-[#181016]/70">Crystal clear 1080p video</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#181016]" />
                </div>
                <h3 className="font-bold text-lg mb-2">All Formats</h3>
                <p className="text-[#181016]/70">TikTok, Reels, YouTube & more</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#00ffff] border-4 border-[#181016] flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-[#181016]" />
                </div>
                <h3 className="font-bold text-lg mb-2">Instant Access</h3>
                <p className="text-[#181016]/70">Download immediately</p>
              </div>
            </div>
          </motion.div>

          {/* CTA for non-authenticated users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-center"
            >
              <p className="text-lg text-[#181016]/70 mb-4">
                Already have an account?
              </p>
              <NeoButton
                variant="secondary"
                size="lg"
                onClick={() => router.push('/login?redirect=/pricing')}
              >
                Sign In to Get Started
              </NeoButton>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </DotPattern>
  );
}
