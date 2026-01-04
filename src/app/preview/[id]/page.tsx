'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, RefreshCw } from 'lucide-react';
import { DotPattern, NeoButton } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { PipMascot } from '@/components/pip-mascot';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Animation, Profile } from '@/lib/supabase/types';

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;
  
  const [animation, setAnimationState] = useState<Animation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasCredits, setHasCredits] = useState(false);
  const [credits, setCredits] = useState(0);
  
  const { currentAnimation } = usePicPipStore();

  // Check auth status and fetch animation
  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        
        // Check authentication
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
          if (typedProfile) {
            const subscribed = typedProfile.subscription_status === 'active' || 
                              typedProfile.subscription_status === 'trial';
            setIsSubscribed(subscribed);
            setCredits(typedProfile.credits || 0);
            setHasCredits((typedProfile.credits || 0) > 0);
          }
        }
        
        // Fetch animation data
        // First check if we have it in state
        if (currentAnimation?.id === animationId) {
          setAnimationState(currentAnimation);
        } else {
          const response = await fetch(`/api/status/${animationId}`);
          if (response.ok) {
            const data = await response.json();
            setAnimationState(data);
          }
        }
      } catch (err) {
        console.error('Error initializing preview:', err);
      } finally {
        setLoading(false);
      }
    }
    
    init();
  }, [animationId, currentAnimation]);

  const handleSaveThis = () => {
    // If animation is already paid, go to celebration
    if (animation?.is_paid) {
      router.push(`/celebration/${animationId}`);
      return;
    }
    
    // If user is authenticated and subscribed, they can use their subscription
    // But they still need to go through checkout to "use" the credit
    if (isAuthenticated && (isSubscribed || hasCredits)) {
      // Go to checkout where they can use their credit/subscription
      router.push(`/checkout/${animationId}`);
    } else {
      // Otherwise, go to checkout/delivery wall
      router.push(`/checkout/${animationId}`);
    }
  };

  const handleTryAnother = () => {
    router.push('/');
  };

  // Determine if we should show watermark
  // Show watermark if: not subscribed AND animation not paid
  const showWatermark = !isSubscribed && !animation?.is_paid;
  
  // Get the appropriate video URL
  // API now returns null for video_url if not paid, so fallback to watermarked
  const videoUrl = animation?.video_url || animation?.watermarked_video_url;

  if (loading) {
    return (
      <DotPattern className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full"
        />
      </DotPattern>
    );
  }

  return (
    <DotPattern className="min-h-screen flex flex-col">
      <Header 
        isAuthenticated={isAuthenticated} 
        isSubscribed={isSubscribed} 
        credits={credits} 
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-8">
        {/* Title Section */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-2">
            Look at it go!
          </h1>
          <p className="text-lg text-[#181016]/70 font-medium">
            Your photo is now alive! Watch it move.
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          className="relative w-full max-w-lg mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Watermark Badge */}
          {showWatermark && (
            <motion.div
              className="absolute -top-3 -right-3 z-20 bg-[#ff61d2] text-white text-sm font-bold px-4 py-2 rounded-full border-3 border-[#181016] shadow-[3px_3px_0_0_#181016] rotate-12"
              animate={{ rotate: [12, 18, 12] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              PicPip.co
            </motion.div>
          )}
          
          <VideoPlayer
            src={videoUrl || '/demo-video.mp4'}
            poster={animation?.original_photo_url || undefined}
            showWatermark={showWatermark}
            hideControls={showWatermark}
            autoPlay
            loop
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col items-center gap-4 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Mascot + Button Row */}
          <div className="flex items-center gap-4 w-full">
            <div className="hidden sm:block">
              <div className="w-20 h-20 bg-[#181016] rounded-lg overflow-hidden border-3 border-[#181016] shadow-[3px_3px_0_0_#181016] transform -rotate-3">
                <PipMascot variant="happy" size="sm" animate={false} />
              </div>
            </div>
            
            <NeoButton
              variant="lime"
              size="lg"
              icon={<Heart className="w-6 h-6 fill-current" />}
              onClick={handleSaveThis}
              className="flex-1"
            >
              I Love It! Save This
            </NeoButton>
          </div>

          {/* Try Another Link */}
          <button
            onClick={handleTryAnother}
            className="flex items-center gap-2 text-[#ff61d2] font-bold text-lg hover:underline underline-offset-4 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Try a different photo
          </button>
        </motion.div>
      </main>
    </DotPattern>
  );
}
