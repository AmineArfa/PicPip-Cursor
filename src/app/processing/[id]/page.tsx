'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Star } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern } from '@/components/ui';
import { usePicPipStore } from '@/lib/store';
import Image from 'next/image';

const PROCESSING_MESSAGES = [
  { message: 'Analyzing your photo...', icon: '🔍' },
  { message: 'Magifying...', icon: '✨' },
  { message: 'Sprinkling Glitter...', icon: '💫' },
  { message: 'Adding motion magic...', icon: '🎬' },
  { message: 'Almost there...', icon: '🌟' },
];

const FUN_FACTS = [
  'Did you know? Pip has processed over 1 million smiles today!',
  'Fun fact: The first animated photo was created in 1878!',
  'Tip: Photos with clear faces work best!',
  'Did you know? PicPip uses AI magic to bring your memories to life!',
];

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;
  
  const [messageIndex, setMessageIndex] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const { currentAnimation, setAnimation, setProcessingStatus } = usePicPipStore();

  // Poll for status updates
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/status/${animationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to check status');
      }
      
      const data = await response.json();
      
      if (data.status === 'completed') {
        setAnimation(data);
        setProcessingStatus('complete');
        router.push(`/preview/${animationId}`);
      } else if (data.status === 'failed') {
        setError('Something went wrong. Please try again.');
        setProcessingStatus('error', 'Processing failed');
      } else {
        // Update progress based on estimated time
        setProgress((prev) => Math.min(prev + 5, 85));
      }
    } catch (err) {
      console.error('Status check error:', err);
      // Don't show error for network issues, just retry
    }
  }, [animationId, router, setAnimation, setProcessingStatus]);

  // Polling effect
  useEffect(() => {
    setProcessingStatus('processing', 'Creating your magic video...');
    
    // Initial check
    checkStatus();
    
    // Poll every 3 seconds
    const pollInterval = setInterval(checkStatus, 3000);
    
    return () => clearInterval(pollInterval);
  }, [checkStatus, setProcessingStatus]);

  // Cycle through messages
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 4000);
    
    return () => clearInterval(messageInterval);
  }, []);

  // Cycle through fun facts
  useEffect(() => {
    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
    }, 8000);
    
    return () => clearInterval(factInterval);
  }, []);

  // Simulate progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 3;
      });
    }, 500);
    
    return () => clearInterval(progressInterval);
  }, []);

  const currentMessage = PROCESSING_MESSAGES[messageIndex];
  const currentFact = FUN_FACTS[factIndex];

  return (
    <div className="min-h-screen bg-[#a855f7] flex flex-col">
      <Header variant="default" />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative elements */}
        <motion.div
          className="absolute top-20 left-8 text-yellow-400"
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Star className="w-12 h-12 fill-current" />
        </motion.div>
        
        <motion.div
          className="absolute top-40 right-12 w-24 h-24 bg-orange-400 rounded-full border-4 border-[#181016]"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        />

        {/* Main Content */}
        <div className="w-full max-w-4xl mx-auto text-center z-10">
          {/* Title */}
          <motion.h1
            className="font-display text-4xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Pip is making your magic...
            <br />
            stay right here!
          </motion.h1>

          {/* Processing Card */}
          <motion.div
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 md:p-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Image Preview */}
              <div className="relative w-full md:w-1/2 aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden border-4 border-[#181016]">
                {currentAnimation?.original_photo_url ? (
                  <Image
                    src={currentAnimation.original_photo_url}
                    alt="Your photo"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                    <span className="text-6xl">📸</span>
                  </div>
                )}
                
                {/* Processing overlay */}
                <motion.div
                  className="absolute inset-0 bg-white/80 flex items-center justify-center"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="bg-white rounded-full px-4 py-2 border-2 border-[#181016] shadow-md flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="text-[#ff61d2]"
                    >
                      ⚙️
                    </motion.span>
                    <span className="font-bold text-sm">{currentMessage.message}</span>
                  </div>
                </motion.div>
              </div>

              {/* Progress Section */}
              <div className="w-full md:w-1/2 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={messageIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="text-left"
                  >
                    <h3 className="text-xl font-bold text-[#181016] flex items-center gap-2">
                      <span>{currentMessage.icon}</span>
                      {currentMessage.message}
                    </h3>
                  </motion.div>
                </AnimatePresence>

                {/* Progress Bar */}
                <div className="w-full h-4 bg-gray-200 rounded-full border-2 border-[#181016] overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {/* Fun Fact */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={factIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-blue-500">ℹ️</span>
                      <p className="text-sm font-medium text-blue-800">{currentFact}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-3"
              >
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <p className="text-red-700 font-bold">{error}</p>
              </motion.div>
            )}
          </motion.div>

          {/* Warning Message */}
          <motion.div
            className="mt-8 bg-white rounded-2xl border-4 border-[#181016] shadow-[4px_4px_0_0_#181016] p-4 max-w-lg mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="font-bold text-[#181016]">
                Please keep this window open until the magic is done.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Decorative shapes */}
        <motion.div
          className="absolute bottom-20 right-8 w-16 h-16"
          animate={{ rotate: [0, 15, 0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <div className="w-full h-full bg-[#ff61d2] clip-pentagon" />
        </motion.div>
      </main>

      <style jsx>{`
        .clip-pentagon {
          clip-path: polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%);
        }
      `}</style>
    </div>
  );
}

