'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Camera, Image as ImageIcon, LogIn } from 'lucide-react';
import { DotPattern, NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { usePicPipStore } from '@/lib/store';
import { validateImageFile, generateGuestSessionId } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    guestSessionId, 
    setGuestSession, 
    setProcessingStatus,
    setAnimation 
  } = usePicPipStore();

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
      
      // Navigate to processing page
      router.push(`/processing/${data.animation.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      setProcessingStatus('error', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [guestSessionId, setGuestSession, setProcessingStatus, setAnimation, router]);

  const handleSingleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleMultiUpload = () => {
    multiFileInputRef.current?.click();
  };

  return (
    <DotPattern className="flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />
      <input
        ref={multiFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Login Button - Top Right */}
      <Link
        href="/login"
        className="absolute top-6 right-6 z-50"
      >
        <motion.button
          className="flex items-center gap-2 px-4 py-2 bg-white border-3 border-[#181016] rounded-full shadow-[3px_3px_0_0_#181016] hover:shadow-[4px_4px_0_0_#181016] hover:-translate-y-0.5 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogIn className="w-5 h-5 text-[#181016]" />
          <span className="font-bold text-[#181016] text-sm md:text-base">Login</span>
        </motion.button>
      </Link>

      {/* Main Container */}
      <main className="w-full max-w-lg mx-auto flex flex-col items-center gap-6 relative z-10 text-center">
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
          className="flex flex-col items-center gap-2 mb-4 px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold text-[#2962ff] leading-tight tracking-tight drop-shadow-sm">
            Bring Your <br /> Memories to Life!
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
          <NeoButton
            variant="primary"
            size="xl"
            pulse={!isUploading}
            icon={<Sparkles className="w-7 h-7" />}
            onClick={handleSingleUpload}
            disabled={isUploading}
            className="max-w-[360px]"
          >
            {isUploading ? 'Uploading...' : 'Start Here'}
          </NeoButton>

          {/* Secondary Button */}
          <NeoButton
            variant="secondary"
            size="lg"
            icon={<Camera className="w-5 h-5" />}
            onClick={handleMultiUpload}
            disabled={isUploading}
            className="max-w-[320px]"
          >
            Upload Many Photos
          </NeoButton>

          {/* Login Link */}
          <Link
            href="/login"
            className="mt-4 text-[#181016]/70 hover:text-[#181016] font-bold text-lg transition-colors flex items-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Already have an account? Login here
          </Link>
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
