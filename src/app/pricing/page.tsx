'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Users, Check, Sparkles, ArrowRight } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton, NeoCard } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import type { Profile } from '@/lib/supabase/types';

type PlanType = 'single' | 'bundle' | 'subscription';

const PLANS = {
  subscription: {
    name: 'Unlimited Magic',
    subtitle: '7 days free, then $9.99/month',
    price: 'Free',
    priceSuperscript: '+',
    description: 'Unlimited Animations',
    buttonText: 'Start Free Trial',
    variant: 'primary' as const,
    badge: { text: 'Best Value', icon: <Star className="w-4 h-4" /> },
    productType: 'subscription' as const,
    features: [
      'Unlimited photo animations',
      'HD video downloads',
      'No watermarks',
      'Cancel anytime',
      '7-day free trial',
    ],
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
    features: [
      '10 photo animations',
      'HD video downloads',
      'No expiration',
      'Perfect for families',
      'Save 60% vs single',
    ],
  },
  single: {
    name: 'Single Snap',
    subtitle: 'One-time payment',
    price: '$4.99',
    priceSuperscript: '',
    description: 'Single HD Download',
    buttonText: 'Buy One',
    variant: 'cyan' as const,
    productType: 'single' as const,
    features: [
      '1 photo animation',
      'HD video download',
      'No watermarks',
      'Instant access',
      'One-time payment',
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

      // For subscription, create checkout session directly
      if (planType === 'subscription') {
        const response = await fetch('/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productType: 'subscription',
            customerEmail: user.email,
            // animationId not required for subscriptions
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
      } else {
        // For single/bundle, user needs to create an animation first
        // Redirect to home page to upload a photo
        router.push('/?purchase=' + planType);
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
            className="text-center mb-12"
          >
            <h1 className="font-display text-5xl md:text-6xl font-bold text-[#181016] mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl md:text-2xl text-[#181016]/70 max-w-2xl mx-auto">
              Bring your memories to life with our flexible pricing options
            </p>
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
                            <Check className="w-5 h-5 text-[#181016] flex-shrink-0 mt-0.5" />
                            <span className="text-[#181016]/80">{feature}</span>
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

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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
                <p className="text-[#181016]/70">Crystal clear video animations</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#a3ff00] border-4 border-[#181016] flex items-center justify-center">
                  <Check className="w-8 h-8 text-[#181016]" />
                </div>
                <h3 className="font-bold text-lg mb-2">No Watermarks</h3>
                <p className="text-[#181016]/70">Clean, professional videos</p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#00ffff] border-4 border-[#181016] flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-[#181016]" />
                </div>
                <h3 className="font-bold text-lg mb-2">Instant Access</h3>
                <p className="text-[#181016]/70">Download immediately after processing</p>
              </div>
            </div>
          </motion.div>

          {/* CTA for non-authenticated users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
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
    </DotPattern>
  );
}

