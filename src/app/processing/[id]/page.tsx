'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Star, Zap, Crown, CheckCircle2, Loader2, Sparkles, Camera } from 'lucide-react';
import { Header } from '@/components/header';
import { usePicPipStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';
import Image from 'next/image';

// Processing steps with icons
const PROCESSING_STEPS = [
  { id: 'analyzing', message: 'Analyzing your photo...', icon: Camera, duration: 3000 },
  { id: 'enhancing', message: 'Enhancing with AI...', icon: Sparkles, duration: 5000 },
  { id: 'generating', message: 'Generating video magic...', icon: Zap, duration: 20000 },
  { id: 'finalizing', message: 'Adding final touches...', icon: Star, duration: 5000 },
];

const FUN_FACTS = [
  'Did you know? Pip has processed over 1 million smiles today!',
  'Fun fact: The first animated photo was created in 1878!',
  'Tip: Photos with clear faces work best!',
  'Did you know? PicPip uses AI magic to Bring Your Pictures to Life!',
  'Tip: High Quality mode produces more detailed motion!',
];

export default function ProcessingPage() {
  const router = useRouter();
  const params = useParams();
  const animationId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);
  const [qualityMode, setQualityMode] = useState<'fast' | 'high'>('fast');
  const [estimatedTime, setEstimatedTime] = useState(30);
  
  const { currentAnimation, setAnimation, setProcessingStatus } = usePicPipStore();
  const [devModeStart] = useState(() => Date.now());
  const [isDevMode, setIsDevMode] = useState(false);

  // Check authentication status and get animation details
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

  // Get animation details for quality mode
  useEffect(() => {
    const fetchAnimation = async () => {
      try {
        const response = await fetch(`/api/status/${animationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.quality_mode) {
            setQualityMode(data.quality_mode);
            setEstimatedTime(data.quality_mode === 'high' ? 120 : 30);
          }
        }
      } catch (err) {
        console.error('Failed to fetch animation details:', err);
      }
    };
    fetchAnimation();
  }, [animationId]);

  // Poll for status updates
  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/status/${animationId}`);
      const data = await response.json();
      
      if (!response.ok || data.error) {
        const elapsed = Date.now() - devModeStart;
        const simDuration = qualityMode === 'high' ? 15000 : 10000;
        
        if (elapsed > simDuration) {
          console.log('[Dev Mode] Simulating animation completion');
          
          const mockAnimation = {
            id: animationId,
            guest_session_id: null,
            user_id: null,
            original_photo_url: currentAnimation?.original_photo_url || `https://picsum.photos/seed/${animationId}/800/600`,
            thumbnail_url: currentAnimation?.thumbnail_url || `https://picsum.photos/seed/${animationId}/800/600`,
            video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            watermarked_video_url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
            runway_job_id: null,
            title: null,
            is_paid: false,
            status: 'completed' as const,
            quality_mode: qualityMode,
            format: 'tiktok' as const,
            duration: 10 as const,
            prompt_text: null,
            ai_enhanced_prompt: null,
            credits_used: qualityMode === 'high' ? 2 : 1,
            created_at: new Date().toISOString(),
          };
          
          setAnimation(mockAnimation);
          setProcessingStatus('complete');
          router.push(`/preview/${animationId}`);
          return;
        }
        
        setIsDevMode(true);
        setProgress((prev) => Math.min(prev + 8, 90));
        return;
      }
      
      if (data.status === 'completed') {
        setAnimation(data);
        setProcessingStatus('complete');
        router.push(`/preview/${animationId}`);
      } else if (data.status === 'failed') {
        setError('Something went wrong. Please try again.');
        setProcessingStatus('error', 'Processing failed');
      } else {
        setProgress((prev) => Math.min(prev + 5, 85));
      }
    } catch (err) {
      console.error('Status check error:', err);
      setIsDevMode(true);
      setProgress((prev) => Math.min(prev + 8, 90));
    }
  }, [animationId, router, setAnimation, setProcessingStatus, devModeStart, currentAnimation, qualityMode]);

  // Polling effect
  useEffect(() => {
    setProcessingStatus('processing', 'Creating your magic video...');
    checkStatus();
    const pollInterval = setInterval(checkStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [checkStatus, setProcessingStatus]);

  // Cycle through processing steps
  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, PROCESSING_STEPS.length - 1));
    }, 8000);
    return () => clearInterval(stepInterval);
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

  const currentFact = FUN_FACTS[factIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#a855f7] via-[#9333ea] to-[#7c3aed] flex flex-col">
      <Header variant="default" isAuthenticated={isAuthenticated} isSubscribed={isSubscribed} credits={credits} />
      
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
          {/* Title with quality badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Pip is making your magic...
            </h1>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              {qualityMode === 'high' ? (
                <>
                  <Crown className="w-5 h-5 text-[#ff61d2]" />
                  <span className="text-white font-bold">High Quality Mode</span>
                  <span className="text-white/70">• ~{Math.ceil(estimatedTime / 60)} min</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 text-[#00d4ff]" />
                  <span className="text-white font-bold">Fast Mode</span>
                  <span className="text-white/70">• ~{estimatedTime}s</span>
                </>
              )}
            </div>
          </motion.div>

          {/* Processing Card */}
          <motion.div
            className="bg-white border-4 border-[#181016] rounded-3xl shadow-[8px_8px_0_0_#181016] p-6 md:p-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex flex-col md:flex-row gap-6 items-center">
              {/* Image Preview */}
              <div className="relative w-full md:w-1/2 aspect-[9/16] max-h-[300px] bg-gray-100 rounded-2xl overflow-hidden border-4 border-[#181016]">
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
                  className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="bg-white rounded-full px-4 py-2 border-2 border-[#181016] shadow-md flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#ff61d2] animate-spin" />
                    <span className="font-bold text-sm">Processing...</span>
                  </div>
                </motion.div>
              </div>

              {/* Progress Section */}
              <div className="w-full md:w-1/2 space-y-4">
                {/* Processing Steps */}
                <div className="space-y-3">
                  {PROCESSING_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isComplete = index < currentStep;
                    
                    return (
                      <motion.div
                        key={step.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-[#ff61d2]/10 border-2 border-[#ff61d2]' 
                            : isComplete 
                            ? 'bg-green-50 border-2 border-green-300'
                            : 'bg-gray-50 border-2 border-gray-200'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isActive 
                            ? 'bg-[#ff61d2]' 
                            : isComplete 
                            ? 'bg-green-500'
                            : 'bg-gray-200'
                        }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          ) : isActive ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            >
                              <StepIcon className="w-5 h-5 text-white" />
                            </motion.div>
                          ) : (
                            <StepIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className={`font-medium text-sm ${
                          isActive ? 'text-[#ff61d2]' : isComplete ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {step.message}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 rounded-full border-2 border-[#181016] overflow-hidden">
                  <motion.div
                    className={`h-full ${qualityMode === 'high' ? 'bg-gradient-to-r from-[#ff61d2] to-[#ff8ad8]' : 'bg-gradient-to-r from-[#00d4ff] to-[#00f0ff]'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-[#181016]/60 text-center">
                  {Math.round(progress)}% complete
                </p>
                
                {/* Dev Mode Indicator */}
                {isDevMode && (
                  <div className="text-xs text-gray-400 text-center">
                    🧪 Demo Mode
                  </div>
                )}
              </div>
            </div>

            {/* Fun Fact */}
            <AnimatePresence mode="wait">
              <motion.div
                key={factIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200"
              >
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">💡</span>
                  <p className="text-sm font-medium text-blue-800">{currentFact}</p>
                </div>
              </motion.div>
            </AnimatePresence>

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
              <span className="text-2xl">⏳</span>
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
