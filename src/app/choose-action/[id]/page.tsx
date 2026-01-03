'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Pencil, Check } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

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

export default function ChooseActionPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;

  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);

  const { currentAnimation, setAnimation, setProcessingStatus } = usePicPipStore();

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
        if (typedProfile?.subscription_status === 'active' || typedProfile?.subscription_status === 'trial') {
          setIsSubscribed(true);
        }
        setCredits(typedProfile?.credits || 0);
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

  const handleContinue = async () => {
    const promptText = getSelectedPrompt();
    if (!promptText) return;

    setIsSubmitting(true);
    setProcessingStatus('processing', 'Starting the magic...');

    try {
      // Trigger the Runway job with the selected prompt
      const response = await fetch('/api/runway/create-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animationId,
          imageUrl: currentAnimation?.original_photo_url,
          promptText,
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
          {/* Title */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white drop-shadow-lg mb-3">
              Choose the Magic! ✨
            </h1>
            <p className="text-xl text-white/90 font-medium">
              What should your picture do?
            </p>
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
                <div className="relative aspect-[3/4] w-full max-w-[280px] mx-auto bg-gray-100 rounded-2xl overflow-hidden border-4 border-[#181016] shadow-[4px_4px_0_0_#181016]">
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

                {/* Continue Button */}
                <div className="mt-auto">
                  <NeoButton
                    variant="primary"
                    size="lg"
                    onClick={handleContinue}
                    disabled={!isReadyToContinue || isSubmitting}
                    icon={<ArrowRight className="w-6 h-6" />}
                    iconPosition="right"
                    pulse={isReadyToContinue && !isSubmitting}
                  >
                    {isSubmitting ? 'Starting Magic...' : 'Make It Move!'}
                  </NeoButton>

                  {/* Selection feedback */}
                  <AnimatePresence>
                    {isReadyToContinue && !isSubmitting && (
                      <motion.p
                        className="text-center mt-4 text-[#181016]/70 font-medium"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {showCustomInput
                          ? `Custom: "${customPrompt.slice(0, 30)}${customPrompt.length > 30 ? '...' : ''}"`
                          : `Selected: ${ACTION_OPTIONS.find(a => a.id === selectedAction)?.emoji} ${ACTION_OPTIONS.find(a => a.id === selectedAction)?.label}`
                        }
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

