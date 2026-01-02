'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, RefreshCw } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { PipMascot } from '@/components/pip-mascot';
import { usePicPipStore } from '@/lib/store';
import type { Animation } from '@/lib/supabase/types';

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;
  
  const [animation, setAnimationState] = useState<Animation | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { 
    currentAnimation, 
    isAuthenticated, 
    isSubscribed 
  } = usePicPipStore();

  // Fetch animation data
  useEffect(() => {
    async function fetchAnimation() {
      try {
        // First check if we have it in state
        if (currentAnimation?.id === animationId) {
          setAnimationState(currentAnimation);
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/status/${animationId}`);
        if (!response.ok) throw new Error('Failed to fetch animation');
        
        const data = await response.json();
        setAnimationState(data);
      } catch (err) {
        console.error('Error fetching animation:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnimation();
  }, [animationId, currentAnimation]);

  const handleSaveThis = () => {
    // If user is authenticated and subscribed, go to celebration
    if (isAuthenticated && isSubscribed) {
      router.push(`/celebration/${animationId}`);
    } else {
      // Otherwise, go to checkout/delivery wall
      router.push(`/checkout/${animationId}`);
    }
  };

  const handleTryAnother = () => {
    router.push('/');
  };

  // Determine if we should show watermark
  const showWatermark = !isSubscribed && !animation?.is_paid;
  
  // Get the appropriate video URL
  const videoUrl = showWatermark 
    ? animation?.watermarked_video_url 
    : animation?.video_url;

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
      {/* Minimal Header */}
      <div className="w-full py-4 flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-[#181016] rounded-full shadow-[4px_4px_0_0_#181016]">
          <div className="w-6 h-6 bg-[#ff61d2] rounded flex items-center justify-center">
            <span className="text-white text-xs">👤</span>
          </div>
          <span className="font-display font-bold text-lg">PicPip.co</span>
        </div>
      </div>

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

