'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Smartphone, Monitor, Square, RectangleVertical } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import { VIDEO_FORMATS, type FormatPreset } from '@/lib/runway/formats';
import type { Profile, VideoFormat } from '@/lib/supabase/types';

// Icon mapping for formats
const FORMAT_ICONS: Record<VideoFormat, React.ReactNode> = {
  tiktok: <Smartphone className="w-6 h-6" />,
  instagram_reel: <Smartphone className="w-6 h-6" />,
  instagram_square: <Square className="w-6 h-6" />,
  instagram_portrait: <RectangleVertical className="w-6 h-6" />,
  landscape: <Monitor className="w-6 h-6" />,
};

export default function ChooseFormatPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;

  const [selectedFormat, setSelectedFormat] = useState<VideoFormat>('tiktok');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);

  const { currentAnimation, setAnimation } = usePicPipStore();

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

  const handleContinue = () => {
    // Navigate to choose-action page with format as query param
    router.push(`/choose-action/${animationId}?format=${selectedFormat}`);
  };

  const formats = Object.values(VIDEO_FORMATS);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a3ff00] via-[#8de600] to-[#7acc00] flex flex-col">
      <Header variant="default" isAuthenticated={isAuthenticated} isSubscribed={isSubscribed} credits={credits} />

      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative floating elements */}
        <motion.div
          className="absolute top-20 left-8 w-16 h-16 bg-[#00d4ff] rounded-full border-4 border-[#181016] opacity-80"
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-40 right-12 w-12 h-12 bg-[#ff61d2] rotate-45 border-4 border-[#181016] opacity-80"
          animate={{ y: [0, 20, 0], rotate: [45, 55, 45] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-32 left-16 w-20 h-20 bg-white rounded-xl border-4 border-[#181016] opacity-70"
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
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[#181016] drop-shadow-lg mb-3">
              Choose Your Format 📐
            </h1>
            <p className="text-xl text-[#181016]/80 font-medium">
              Where will you share your video?
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 md:p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Photo Preview with Format Overlay */}
              <div className="lg:w-2/5 flex-shrink-0">
                <div className="relative w-full max-w-[280px] mx-auto">
                  {/* Format preview frame */}
                  <div 
                    className="relative bg-gray-100 rounded-2xl overflow-hidden border-4 border-[#181016] shadow-[4px_4px_0_0_#181016] transition-all duration-300"
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
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-lime-100 to-green-100">
                        <span className="text-6xl">📸</span>
                      </div>
                    )}
                  </div>
                  {/* Format label */}
                  <div className="mt-4 text-center">
                    <p className="text-sm font-bold text-[#181016]/70">
                      Video format: {VIDEO_FORMATS[selectedFormat].aspectRatio} • {VIDEO_FORMATS[selectedFormat].name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Format Options */}
              <div className="lg:w-3/5 flex flex-col">
                <h2 className="text-xl font-bold text-[#181016] mb-4 flex items-center gap-2">
                  {FORMAT_ICONS[selectedFormat]}
                  Select a format
                </h2>

                {/* Format Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {formats.map((format, index) => (
                    <motion.button
                      key={format.id}
                      onClick={() => setSelectedFormat(format.id)}
                      className={`
                        relative p-4 rounded-xl border-3 transition-all text-left
                        ${selectedFormat === format.id
                          ? 'border-[#a3ff00] bg-[#a3ff00]/10 shadow-[3px_3px_0_0_#a3ff00]'
                          : 'border-[#181016] bg-white hover:bg-gray-50 shadow-[3px_3px_0_0_#181016] hover:shadow-[4px_4px_0_0_#181016]'
                        }
                      `}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{format.icon}</span>
                        <div className="flex-1">
                          <span className="font-bold text-sm block">{format.name}</span>
                          <span className="text-xs text-[#181016]/60">Video format: {format.aspectRatio}</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#181016]/70 mt-2">{format.description}</p>
                      
                      {/* Platform tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {format.platforms.slice(0, 2).map((platform) => (
                          <span 
                            key={platform}
                            className="text-xs px-2 py-0.5 bg-[#181016]/10 rounded-full"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>

                      {selectedFormat === format.id && (
                        <motion.div
                          className="absolute -top-2 -right-2 w-6 h-6 bg-[#a3ff00] rounded-full flex items-center justify-center border-2 border-[#181016]"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-4 h-4 text-[#181016]" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>

                {/* Continue Button */}
                <div className="mt-auto">
                  <NeoButton
                    variant="lime"
                    size="lg"
                    onClick={handleContinue}
                    icon={<ArrowRight className="w-6 h-6" />}
                    iconPosition="right"
                    pulse
                  >
                    Choose Action
                  </NeoButton>

                  {/* Selection feedback */}
                  <motion.p
                    className="text-center mt-4 text-[#181016]/70 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {VIDEO_FORMATS[selectedFormat].icon} {VIDEO_FORMATS[selectedFormat].name} selected
                  </motion.p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

