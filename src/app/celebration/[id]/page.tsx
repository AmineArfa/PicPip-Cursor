'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Download, MessageCircle, Mail, PartyPopper } from 'lucide-react';
import { DotPattern, NeoButton } from '@/components/ui';
import { VideoPlayer } from '@/components/video-player';
import { PipMascot } from '@/components/pip-mascot';
import type { Animation } from '@/lib/supabase/types';

function CelebrationContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const animationId = params.id as string;
  const sessionId = searchParams.get('session_id');
  
  const { width, height } = useWindowSize();
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [showConfetti, setShowConfetti] = useState(true);
  const [loading, setLoading] = useState(true);

  // Stop confetti after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch animation data
  useEffect(() => {
    async function fetchAnimation() {
      try {
        const response = await fetch(`/api/status/${animationId}`);
        if (!response.ok) throw new Error('Failed to fetch animation');
        
        const data = await response.json();
        setAnimation(data);
      } catch (err) {
        console.error('Error fetching animation:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAnimation();
  }, [animationId]);

  const handleDownload = async () => {
    if (!animation?.video_url) return;
    
    try {
      const response = await fetch(animation.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `picpip-memory-${animationId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback: open in new tab
      window.open(animation.video_url, '_blank');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent('Check out this magical memory I created with PicPip! 🎬✨');
    const url = encodeURIComponent(animation?.video_url || window.location.href);
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('My Magical Memory from PicPip!');
    const body = encodeURIComponent(`I created this amazing animated memory with PicPip.co!\n\nWatch it here: ${animation?.video_url || window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

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
    <DotPattern variant="dense" className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          colors={['#ff61d2', '#00ffff', '#a3ff00', '#2962ff', '#FFD700']}
        />
      )}

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-20 left-8 text-[#ff61d2]"
        animate={{ rotate: [0, 15, 0, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <Star className="w-12 h-12" />
      </motion.div>
      
      <motion.div
        className="absolute top-40 right-12 w-8 h-8 bg-[#2962ff] rounded-full"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Minimal Header */}
      <div className="w-full py-4 flex justify-between items-center px-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-4 border-[#181016] rounded-full shadow-[4px_4px_0_0_#181016]">
          <PartyPopper className="w-5 h-5 text-[#ff61d2]" />
          <span className="font-display font-bold text-lg">PicPip.co</span>
        </div>
        <button className="p-2 rounded-full border-2 border-[#181016] bg-white hover:bg-gray-50">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 pb-8">
        {/* Bird Avatar + Title */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-[#181016] border-4 border-[#181016] overflow-hidden mb-4">
            <PipMascot variant="happy" size="sm" animate={false} />
          </div>
          
          <div className="bg-white border-4 border-[#181016] rounded-2xl p-6 shadow-[6px_6px_0_0_#181016] text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] mb-2">
              IT&apos;S YOURS!
            </h1>
            <p className="text-lg text-[#181016]/70 font-medium">
              Your animation is ready for the world.
            </p>
          </div>
        </motion.div>

        {/* Video Player */}
        <motion.div
          className="w-full max-w-lg mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <VideoPlayer
            src={animation?.video_url || '/demo-video.mp4'}
            poster={animation?.original_photo_url || undefined}
            showWatermark={false}
            autoPlay
            loop
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-4 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <NeoButton
            variant="primary"
            size="lg"
            icon={<Download className="w-6 h-6" />}
            onClick={handleDownload}
          >
            Save to My Phone
          </NeoButton>

          <NeoButton
            variant="lime"
            size="lg"
            icon={<MessageCircle className="w-6 h-6" />}
            onClick={handleWhatsApp}
          >
            Send on WhatsApp
          </NeoButton>

          <NeoButton
            variant="secondary"
            size="lg"
            icon={<Mail className="w-6 h-6" />}
            onClick={handleEmail}
          >
            Send to My Email
          </NeoButton>

          {/* Email reminder */}
          <motion.div
            className="mt-4 bg-white border-2 border-dashed border-[#181016]/30 rounded-xl p-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-[#181016]/70 font-medium flex items-center justify-center gap-2">
              <span className="text-xl">🎉</span>
              Check your email for your permanent link!
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Decorative Triangle */}
      <motion.div
        className="absolute bottom-20 right-8"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-[#a3ff00]" />
      </motion.div>

      {/* Footer */}
      <footer className="w-full py-4 text-center text-[#181016]/50 font-bold text-sm">
        <p>DESIGNED FOR PICPIP.CO</p>
      </footer>
    </DotPattern>
  );
}

function CelebrationLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F4FD] to-[#D4E9F7] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#ff61d2] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function CelebrationPage() {
  return (
    <Suspense fallback={<CelebrationLoading />}>
      <CelebrationContent />
    </Suspense>
  );
}

// Star component for decorations
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

