'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Image as ImageIcon, LogIn, User } from 'lucide-react';
import { Header } from '@/components/header';
import { DotPattern, NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { usePicPipStore } from '@/lib/store';
import { validateImageFile, generateGuestSessionId } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/supabase/types';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [credits, setCredits] = useState(0);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const { 
    guestSessionId, 
    setGuestSession, 
    setProcessingStatus,
    setAnimation 
  } = usePicPipStore();

  // Check authentication status and refresh session
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      // Refresh session to keep it alive
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Refresh the session to extend expiration
        await supabase.auth.refreshSession();
        setIsAuthenticated(true);

        // Fetch profile to get credits and subscription status
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        const typedProfile = profile as Profile | null;
        if (typedProfile?.subscription_status === 'active' || typedProfile?.subscription_status === 'trial') {
          setIsSubscribed(true);
        }
        setCredits(typedProfile?.credits || 0);
      } else {
        setIsAuthenticated(false);
      }
      
      setIsLoadingAuth(false);
    };
    
    checkAuth();
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setProcessingStatus('uploading', 'Preparing your photo...');
    
    try {
      // Ensure we have a guest session ID
      let sessionId = guestSessionId;
      if (!sessionId) {
        sessionId = generateGuestSessionId();
        setGuestSession(sessionId);
      }
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('guestSessionId', sessionId);
      
      // Upload to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Store animation data
      setAnimation(data.animation);
      
      // Navigate to choose action page (intermediary step)
      router.push(`/choose-action/${data.animation.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      setProcessingStatus('error', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [guestSessionId, setGuestSession, setProcessingStatus, setAnimation, router]);

  const handleUpload = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('handleUpload called', { hasRef: !!fileInputRef.current });
    
    // Ensure the file input is accessible and trigger click
    if (fileInputRef.current) {
      try {
        fileInputRef.current.click();
        console.log('File input clicked');
      } catch (error) {
        console.error('Error clicking file input:', error);
      }
    } else {
      console.error('File input ref is not available');
    }
  }, []);

  return (
    <DotPattern className="flex flex-col min-h-screen overflow-hidden">
      <Header 
        isAuthenticated={isAuthenticated} 
        isSubscribed={isSubscribed} 
        credits={credits} 
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={false}
        style={{ display: 'none' }}
        onChange={(e) => {
          console.log('File input onChange triggered', e.target.files);
          handleFileSelect(e.target.files);
          // Reset the input so the same file can be selected again
          if (e.target) {
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-center gap-6 relative z-10 text-center px-4 py-8">
        {/* Mascot Section */}
        <div className="relative mb-2">
          <PipMascot variant="frame" size="xl" />
          
          {/* Floating photo icon */}
          <motion.div
            className="absolute -bottom-2 -right-2 bg-white border-4 border-[#181016] p-3 rotate-12 shadow-[4px_4px_0_0_#181016] rounded-lg"
            animate={{ rotate: [12, 18, 12] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ImageIcon className="w-8 h-8 text-[#2962ff]" />
          </motion.div>
        </div>

        {/* Text Content */}
        <motion.div
          className="flex flex-col items-center gap-2 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#2962ff] leading-tight tracking-tight drop-shadow-sm">
            Bring Your <br /> Pictures to Life!
          </h1>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[360px] p-4 bg-red-100 border-4 border-red-500 rounded-2xl text-red-700 font-bold"
          >
            {error}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col gap-5 w-full items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Primary Pulse Button */}
          <div className="max-w-[360px] w-full">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="relative group w-full cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Shadow Layer */}
              <div className="absolute inset-0 rounded-full bg-[#181016] translate-x-1.5 translate-y-1.5" />
              
              {/* Button Content */}
              <div className={`
                relative flex items-center justify-center gap-3 w-full rounded-full border-4 border-[#181016] 
                transition-colors bg-[#ff61d2] text-white hover:bg-[#ff7dd9] 
                h-20 md:h-24 px-10 text-2xl md:text-3xl font-black
                ${!isUploading && 'animate-pulse-slow hover:animate-none'}
              `}>
                <Sparkles className="w-7 h-7 flex-shrink-0" />
                <span className="font-display uppercase tracking-wide">
                  {isUploading ? 'Uploading...' : 'Start Here'}
                </span>
              </div>
            </button>
          </div>

          {/* Auth Link */}
          {!isAuthenticated && (
            <Link
              href="/login"
              className="mt-4 text-[#181016]/70 hover:text-[#181016] font-bold text-lg transition-colors flex items-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Already have an account? Login here
            </Link>
          )}
          {isAuthenticated && (
            <Link
              href="/memories"
              className="mt-4 text-[#181016]/70 hover:text-[#181016] font-bold text-lg transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              View your memories
            </Link>
          )}
        </motion.div>
      </main>

      {/* Decorative Wavy Lines */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 40">
          <path
            d="M0 20 Q 150 0, 300 20 T 600 20 T 900 20 T 1200 20"
            stroke="#2962ff"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </div>
    </DotPattern>
  );
}

      {/* Decorative Wavy Lines */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 40">
          <path
            d="M0 20 Q 150 0, 300 20 T 600 20 T 900 20 T 1200 20"
            stroke="#2962ff"
            strokeWidth="4"
            fill="none"
          />
        </svg>
      </div>
    </DotPattern>
  );
}
