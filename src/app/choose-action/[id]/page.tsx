'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Pencil, Check, Zap, Crown, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { VIDEO_FORMATS } from '@/lib/runway/formats';
import { CREDIT_COSTS } from '@/lib/stripe';
import type { Profile, VideoFormat, QualityMode } from '@/lib/supabase/types';

// Predefined action options with emoji icons
const ACTION_OPTIONS = [
  { id: 'dance', label: 'Dance', emoji: '💃', prompt: 'Dancing with joy, rhythmic movements, happy celebration' },
  { id: 'hug', label: 'Hug', emoji: '🤗', prompt: 'Warm embrace, hugging motion, affectionate gesture' },
  { id: 'wave', label: 'Wave', emoji: '👋', prompt: 'Waving hello, friendly greeting, hand gesture' },
  { id: 'laugh', label: 'Laugh', emoji: '😂', prompt: 'Laughing out loud, joyful expression, genuine happiness' },
  { id: 'jump', label: 'Jump', emoji: '🦘', prompt: 'Jumping with excitement, bouncing motion, energetic leap' },
  { id: 'blow-kiss', label: 'Blow Kiss', emoji: '😘', prompt: 'Blowing a kiss, romantic gesture, sending love' },
  { id: 'cheer', label: 'Cheer', emoji: '🎉', prompt: 'Cheering celebration, arms raised, victorious moment' },
  { id: 'wink', label: 'Wink', emoji: '😉', prompt: 'Playful wink, subtle expression, charming gesture' },
];

function ChooseActionContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const animationId = params.id as string;
  
  // Get format from URL or default to tiktok
  const formatParam = searchParams.get('format') as VideoFormat | null;
  const selectedFormat = formatParam && VIDEO_FORMATS[formatParam] ? formatParam : 'tiktok';

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [qualityMode, setQualityMode] = useState<QualityMode>('fast');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);
  const [dailyHighRemaining, setDailyHighRemaining] = useState(5);

  const { currentAnimation, setAnimation, setProcessingStatus, setCredits: setStoreCredits, setUserState } = usePicPipStore();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const typedProfile = profile as Profile | null;
        const userIsSubscribed = typedProfile?.subscription_status === 'active' || typedProfile?.subscription_status === 'trial';
        if (userIsSubscribed) {
          setIsSubscribed(true);
        }
        const userCredits = typedProfile?.credits || 0;
        setCredits(userCredits);
        // Also update global store so header reflects current state
        setUserState(true, userIsSubscribed, userCredits);
        
        // Calculate daily high remaining
        const today = new Date().toISOString().split('T')[0];
        const resetDate = typedProfile?.high_quality_reset_date;
        const highCount = typedProfile?.high_quality_count_today || 0;
        
        if (resetDate === today) {
          setDailyHighRemaining(Math.max(0, 5 - highCount));
        } else {
          setDailyHighRemaining(5);
        }
      }
    };

    checkAuth();
  }, []);

  // Fetch animation data if not in store
  useEffect(() => {
    const fetchAnimation = async () => {
      if (!currentAnimation || currentAnimation.id !== animationId) {
        try {
          const response = await fetch(`/api/status/${animationId}`);
          if (response.ok) {
            const data = await response.json();
            setAnimation(data);
          }
        } catch (err) {
          console.error('Failed to fetch animation:', err);
        }
      }
    };

    fetchAnimation();
  }, [animationId, currentAnimation, setAnimation]);

  const getSelectedPrompt = (): string => {
    if (showCustomInput && customPrompt.trim()) {
      return customPrompt.trim();
    }
    if (selectedAction) {
      const action = ACTION_OPTIONS.find(a => a.id === selectedAction);
      return action?.prompt || '';
    }
    return '';
  };

  const getCreditCost = () => CREDIT_COSTS[qualityMode];

  const canAfford = () => {
    // When logged off, allow launching (will ask for credits after)
    if (!isAuthenticated) {
      return true;
    }
    // When logged on, check credits/subscription
    if (isSubscribed) {
      if (qualityMode === 'high') {
        return dailyHighRemaining > 0;
      }
      return true; // Unlimited fast for subscribers
    }
    return credits >= getCreditCost();
  };

  const handleContinue = async () => {
    const promptText = getSelectedPrompt();
    if (!promptText) return;

    // Only check credits if user is authenticated
    if (isAuthenticated && !canAfford()) {
      router.push('/pricing');
      return;
    }

    setIsSubmitting(true);
    setProcessingStatus('processing', 'Starting the magic...');

    try {
      // Step 1: Deduct credits first (if user has credits/subscription)
      if (isAuthenticated) {
        const creditResponse = await fetch('/api/checkout/use-credit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animationId,
            qualityMode,
          }),
        });

        if (!creditResponse.ok) {
          const creditError = await creditResponse.json();
          console.error('Credit deduction failed:', creditError);
          setProcessingStatus('error', creditError.error || 'Failed to use credit');
          setIsSubmitting(false);
          
          // If not enough credits, redirect to pricing
          if (creditResponse.status === 402) {
            router.push('/pricing');
          }
          return;
        }
        
        const creditResult = await creditResponse.json();
        console.log(`[Credits] Used ${creditResult.creditsUsed} credit(s) for ${qualityMode} mode`);
        
        // Update both local and global state with new credit balance
        const newCredits = creditResult.credits ?? (credits - creditResult.creditsUsed);
        setCredits(newCredits);
        setStoreCredits(newCredits);
      }

      // Step 2: Trigger the Runway job with the selected prompt, format, and quality
      const response = await fetch('/api/runway/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationId,
          imageUrl: currentAnimation?.original_photo_url,
          promptText,
          format: selectedFormat,
          qualityMode,
          duration: VIDEO_FORMATS[selectedFormat].duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start animation');
      }

      // Navigate to processing page
      router.push(`/processing/${animationId}`);
    } catch (err) {
      console.error('Error starting animation:', err);
      setProcessingStatus('error', 'Failed to start animation');
      setIsSubmitting(false);
    }
  };

  const isReadyToContinue = showCustomInput ? customPrompt.trim().length > 0 : selectedAction !== null;
  const formatInfo = VIDEO_FORMATS[selectedFormat];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00d4ff] via-[#00b8e6] to-[#0099cc] flex flex-col">
      <Header variant="default" isAuthenticated={isAuthenticated} isSubscribed={isSubscribed} credits={credits} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative floating elements */}
        <motion.div
          className="absolute top-20 left-8 w-16 h-16 bg-[#ff61d2] rounded-full border-4 border-[#181016] opacity-80"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-12 w-12 h-12 bg-[#a3ff00] rotate-45 border-4 border-[#181016] opacity-80"
          animate={{ y: [0, 20, 0], rotate: [45, 55, 45] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-20 h-20 bg-[#FFEB3B] rounded-xl border-4 border-[#181016] opacity-70"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="w-full max-w-4xl mx-auto z-10">
          {/* Back button and Title */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push(`/choose-format/${animationId}`)}
              className="flex items-center gap-2 text-white/80 hover:text-white mb-4 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Change format
            </button>
            <div className="text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
                Choose the Magic! ✨
              </h1>
              <p className="text-xl text-white/90 font-medium">
                What should your picture do?
              </p>
              {/* Format badge */}
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-medium">
                <span>{formatInfo.icon}</span>
                <span>{formatInfo.name}</span>
                <span className="text-white/70">•</span>
                <span className="text-white/70">{formatInfo.aspectRatio}</span>
              </div>
            </div>
          </motion.div>

          {/* Main Card */}
          <motion.div
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Photo Preview */}
              <div className="lg:w-2/5 flex-shrink-0">
                <div 
                  className="relative w-full max-w-[280px] mx-auto bg-gray-100 rounded-2xl overflow-hidden border-4 border-[#181016] shadow-[4px_4px_0_0_#181016]"
                  style={{
                    aspectRatio: selectedFormat === 'landscape' 
                      ? '16/9' 
                      : selectedFormat === 'instagram_square'
                      ? '1/1'
                      : selectedFormat === 'instagram_portrait'
                      ? '4/5'
                      : '9/16',
                  }}
                >
                  {currentAnimation?.original_photo_url ? (
                    <Image
                      src={currentAnimation.original_photo_url}
                      alt="Your uploaded photo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                      <span className="text-6xl">📸</span>
                    </div>
                  )}
                  {/* Photo label */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 border-2 border-[#181016]">
                    <p className="text-sm font-bold text-center">Your Photo</p>
                  </div>
                </div>
              </div>

              {/* Action Options */}
              <div className="lg:w-3/5 flex flex-col">
                <h2 className="text-xl font-bold text-[#181016] mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#ff61d2]" />
                  Pick an action
                </h2>

                {/* Action Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  {ACTION_OPTIONS.map((action, index) => (
                    <motion.button
                      key={action.id}
                      onClick={() => {
                        setSelectedAction(action.id);
                        setShowCustomInput(false);
                      }}
                      className={`
                        relative p-4 rounded-xl border-3 transition-all text-center
                        ${selectedAction === action.id && !showCustomInput
                          ? 'border-[#ff61d2] bg-[#ff61d2]/10 shadow-[3px_3px_0_0_#ff61d2]'
                          : 'border-[#181016] bg-white hover:bg-gray-50 shadow-[3px_3px_0_0_#181016] hover:shadow-[4px_4px_0_0_#181016]'
                        }
                      `}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl mb-1 block">{action.emoji}</span>
                      <span className="font-bold text-sm">{action.label}</span>
                      {selectedAction === action.id && !showCustomInput && (
                        <motion.div
                          className="absolute -top-2 -right-2 w-6 h-6 bg-[#ff61d2] rounded-full flex items-center justify-center border-2 border-[#181016]"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Custom Prompt Option */}
                <div className="mb-6">
                  <motion.button
                    onClick={() => {
                      setShowCustomInput(!showCustomInput);
                      if (!showCustomInput) {
                        setSelectedAction(null);
                      }
                    }}
                    className={`
                      w-full p-4 rounded-xl border-3 transition-all flex items-center justify-center gap-3
                      ${showCustomInput
                        ? 'border-[#2962ff] bg-[#2962ff]/10 shadow-[3px_3px_0_0_#2962ff]'
                        : 'border-[#181016] bg-white hover:bg-gray-50 shadow-[3px_3px_0_0_#181016]'
                      }
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Pencil className={`w-5 h-5 ${showCustomInput ? 'text-[#2962ff]' : 'text-[#181016]'}`} />
                    <span className={`font-bold ${showCustomInput ? 'text-[#2962ff]' : 'text-[#181016]'}`}>
                      Something else? Type your own!
                    </span>
                  </motion.button>

                  <AnimatePresence>
                    {showCustomInput && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3"
                      >
                        <textarea
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder="Describe what you want... e.g., 'Singing a song' or 'Playing guitar'"
                          className="w-full p-4 rounded-xl border-3 border-[#181016] bg-white shadow-[3px_3px_0_0_#181016] focus:outline-none focus:border-[#2962ff] focus:shadow-[3px_3px_0_0_#2962ff] transition-all resize-none font-medium"
                          rows={3}
                          maxLength={200}
                        />
                        <p className="text-right text-sm text-gray-500 mt-1">
                          {customPrompt.length}/200
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Video Duration Toggle */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-[#181016] mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Video Duration
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Standard 5s Mode */}
                    <motion.button
                      onClick={() => setQualityMode('fast')}
                      className={`
                        relative p-4 rounded-xl border-3 transition-all
                        ${qualityMode === 'fast'
                          ? 'border-[#00d4ff] bg-[#00d4ff]/10 shadow-[3px_3px_0_0_#00d4ff]'
                          : 'border-[#181016] bg-white hover:bg-gray-50 shadow-[3px_3px_0_0_#181016]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#00d4ff]" />
                          <span className="font-bold">5 Seconds</span>
                        </div>
                        {qualityMode === 'fast' && (
                          <div className="w-5 h-5 bg-[#00d4ff] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#181016]/60 text-left">Quick preview • ~30s wait</p>
                      <div className="mt-2 text-left">
                        {isSubscribed ? (
                          <span className="text-xs font-bold text-[#00d4ff]">Unlimited</span>
                        ) : (
                          <span className="text-sm font-bold">{CREDIT_COSTS.fast} credit</span>
                        )}
                      </div>
                    </motion.button>

                    {/* Extended 10s Mode */}
                    <motion.button
                      onClick={() => setQualityMode('high')}
                      className={`
                        relative p-4 rounded-xl border-3 transition-all
                        ${qualityMode === 'high'
                          ? 'border-[#ff61d2] bg-[#ff61d2]/10 shadow-[3px_3px_0_0_#ff61d2]'
                          : 'border-[#181016] bg-white hover:bg-gray-50 shadow-[3px_3px_0_0_#181016]'
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="absolute -top-2 -right-2 bg-[#ff61d2] text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-[#181016]">
                        2X
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Crown className="w-5 h-5 text-[#ff61d2]" />
                          <span className="font-bold">10 Seconds</span>
                        </div>
                        {qualityMode === 'high' && (
                          <div className="w-5 h-5 bg-[#ff61d2] rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[#181016]/60 text-left">Full length • ~60s wait</p>
                      <div className="mt-2 text-left">
                        {isSubscribed ? (
                          <span className="text-xs font-bold text-[#ff61d2]">{dailyHighRemaining}/5 today</span>
                        ) : (
                          <span className="text-sm font-bold">{CREDIT_COSTS.high} credits</span>
                        )}
                      </div>
                    </motion.button>
                  </div>
                </div>

                {/* Continue Button */}
                <div className="mt-auto">
                  <NeoButton
                    variant="primary"
                    size="lg"
                    onClick={handleContinue}
                    disabled={!isReadyToContinue || isSubmitting || (isAuthenticated && !canAfford())}
                    icon={<ArrowRight className="w-6 h-6" />}
                    iconPosition="right"
                    pulse={isReadyToContinue && !isSubmitting && (isAuthenticated ? canAfford() : true)}
                  >
                    {isSubmitting ? 'Starting Magic...' : (isAuthenticated && !canAfford()) ? 'Need More Credits' : 'Make It Move!'}
                  </NeoButton>

                  {/* Credit/subscription info */}
                  <div className="text-center mt-4">
                    {isAuthenticated && !canAfford() ? (
                      <p className="text-red-500 font-medium">
                        {isSubscribed && qualityMode === 'high'
                          ? "You've used all 5 extended videos today"
                          : `Not enough credits (need ${getCreditCost()})`
                        }
                      </p>
                    ) : isReadyToContinue && !isSubmitting ? (
                      <motion.p
                        className="text-[#181016]/70 font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {showCustomInput
                          ? `Custom: "${customPrompt.slice(0, 30)}${customPrompt.length > 30 ? '...' : ''}"`
                          : `${ACTION_OPTIONS.find(a => a.id === selectedAction)?.emoji} ${ACTION_OPTIONS.find(a => a.id === selectedAction)?.label}`
                        }
                        {' • '}
                        {qualityMode === 'high' ? (
                          <span className="text-[#ff61d2]">10s video</span>
                        ) : (
                          <span className="text-[#00d4ff]">5s video</span>
                        )}
                      </motion.p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00d4ff] via-[#00b8e6] to-[#0099cc] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function ChooseActionPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChooseActionContent />
    </Suspense>
  );
}
