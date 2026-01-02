'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Download, Share2, Play, Sparkles } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton, NeoCard } from '@/components/ui';
import { PipMascot, SpeechBubble } from '@/components/pip-mascot';
import type { Animation, Profile } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/utils';
import Image from 'next/image';

interface MemoriesContentProps {
  animations: Animation[];
  profile: Profile | null;
  isSubscribed: boolean;
}

export function MemoriesContent({ animations, profile, isSubscribed }: MemoriesContentProps) {
  const router = useRouter();
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleDownload = async (animation: Animation) => {
    if (!animation.video_url) return;
    
    try {
      const response = await fetch(animation.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `picpip-${animation.title || animation.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(animation.video_url, '_blank');
    }
  };

  const handleShare = async (animation: Animation) => {
    if (navigator.share && animation.video_url) {
      try {
        await navigator.share({
          title: animation.title || 'My PicPip Memory',
          text: 'Check out this magical memory I created with PicPip!',
          url: animation.video_url,
        });
      } catch {
        // User cancelled or share failed
      }
    }
  };

  const handleCreateNew = () => {
    router.push('/');
  };

  return (
    <DotPattern className="min-h-screen flex flex-col">
      <Header isAuthenticated={true} isSubscribed={isSubscribed} credits={profile?.credits || 0} />

      <main className="flex-1 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            className="flex items-center gap-6 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="hidden sm:block">
              <PipMascot variant="happy" size="md" />
            </div>
            <SpeechBubble className="flex-1 max-w-md">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-[#181016] mb-1">
                Your magic vault!
              </h1>
              <p className="text-[#181016]/70">
                Here are all the photos you brought to life.
              </p>
            </SpeechBubble>
          </motion.div>

          {/* Animations Grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {animations.map((animation, index) => (
              <motion.div
                key={animation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <AnimationCard
                  animation={animation}
                  isPlaying={playingId === animation.id}
                  onPlay={() => setPlayingId(animation.id)}
                  onPause={() => setPlayingId(null)}
                  onDownload={() => handleDownload(animation)}
                  onShare={() => handleShare(animation)}
                />
              </motion.div>
            ))}

            {/* Add New Memory Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * animations.length }}
            >
              <button
                onClick={handleCreateNew}
                className="w-full h-full min-h-[300px] border-4 border-dashed border-[#181016]/30 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-[#ff61d2] hover:bg-[#ff61d2]/5 transition-colors group"
              >
                <div className="w-16 h-16 rounded-full bg-[#ff61d2] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="font-display text-xl font-bold text-[#181016]">
                    Add a New Memory
                  </h3>
                  <p className="text-[#181016]/60 text-sm mt-1">
                    Bring another photo to life!
                  </p>
                </div>
              </button>
            </motion.div>
          </motion.div>

          {/* Bottom CTA */}
          <motion.div
            className="mt-12 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <NeoButton
              variant="primary"
              size="lg"
              icon={<Sparkles className="w-5 h-5" />}
              onClick={handleCreateNew}
              className="max-w-md"
            >
              Make a New Magic Photo
            </NeoButton>
          </motion.div>
        </div>
      </main>
    </DotPattern>
  );
}

interface AnimationCardProps {
  animation: Animation;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onDownload: () => void;
  onShare: () => void;
}

function AnimationCard({
  animation,
  isPlaying,
  onPlay,
  onPause,
  onDownload,
  onShare,
}: AnimationCardProps) {
  return (
    <NeoCard className="overflow-hidden p-0" hover={false}>
      {/* Video/Image Container */}
      <div className="relative aspect-square bg-gray-100">
        {isPlaying && animation.video_url ? (
          <video
            src={animation.video_url}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={animation.thumbnail_url || animation.original_photo_url}
            alt={animation.title || 'Memory'}
            fill
            className="object-cover"
          />
        )}
        
        {/* Play Button Overlay */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
        >
          <div className="w-14 h-14 rounded-full bg-[#ff61d2] border-3 border-white flex items-center justify-center shadow-lg">
            <Play className={`w-6 h-6 text-white ${isPlaying ? '' : 'ml-1'}`} fill="white" />
          </div>
        </button>
      </div>

      {/* Info Section */}
      <div className="p-4 border-t-4 border-[#181016]">
        <h3 className="font-display text-lg font-bold text-[#181016] truncate">
          {animation.title || 'Untitled Memory'}
        </h3>
        <p className="text-sm text-[#181016]/60 mt-1">
          Created {formatRelativeTime(animation.created_at)}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#fffde7] border-2 border-[#181016] rounded-full text-sm font-bold hover:bg-[#fff7ae] transition-colors"
          >
            <Download className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={onShare}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-[#fffde7] border-2 border-[#181016] rounded-full text-sm font-bold hover:bg-[#fff7ae] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>
    </NeoCard>
  );
}

