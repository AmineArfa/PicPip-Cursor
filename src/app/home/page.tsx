'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';
import { DotPattern, NeoButton } from '@/components/ui';
import { PipMascot } from '@/components/pip-mascot';
import { usePicPipStore } from '@/lib/store';
import { validateImageFile, generateGuestSessionId } from '@/lib/utils';

export default function SubscribedHomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }
    
    setError(null);
    setIsUploading(true);
    setProcessingStatus('uploading', 'Preparing your photo...');
    
    try {
      let sessionId = guestSessionId;
      if (!sessionId) {
        sessionId = generateGuestSessionId();
        setGuestSession(sessionId);
      }
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('guestSessionId', sessionId);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
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

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-[#FFEB3B] relative overflow-hidden">
      {/* Dot Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: 'radial-gradient(#ffffff 20%, transparent 20%)',
          backgroundPosition: '0 0, 25px 25px',
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* Subscription Badge */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 px-6 py-3 bg-white border-4 border-[#181016] rounded-full shadow-[4px_4px_0_0_#181016]">
          <div className="w-6 h-6 rounded-full bg-[#a3ff00] flex items-center justify-center border-2 border-[#181016]">
            <Check className="w-4 h-4 text-[#181016]" strokeWidth={3} />
          </div>
          <span className="font-display font-bold text-lg uppercase tracking-wide">
            Unlimited Mode Active
          </span>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-32 left-8 text-[#8b8b8b]/30"
        animate={{ rotate: [0, 10, 0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <svg className="w-16 h-16" viewBox="0 0 100 20">
          <path d="M0 10 Q25 0, 50 10 T100 10" stroke="currentColor" strokeWidth="4" fill="none" />
        </svg>
      </motion.div>

      <motion.div
        className="absolute bottom-32 right-8 w-24 h-24 rounded-full border-4 border-white/50"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Mascot */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative">
            <div className="w-64 h-64 md:w-80 md:h-80 bg-white rounded-[40px] border-4 border-[#181016] shadow-[8px_8px_0_0_#181016] flex items-center justify-center overflow-hidden">
              <PipMascot variant="tablet" size="xl" animate />
            </div>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 w-full max-w-[360px] p-4 bg-red-100 border-4 border-red-500 rounded-2xl text-red-700 font-bold text-center"
          >
            {error}
          </motion.div>
        )}

        {/* Create Magic Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md"
        >
          <NeoButton
            variant="primary"
            size="xl"
            pulse={!isUploading}
            icon={<Sparkles className="w-7 h-7" />}
            onClick={handleUpload}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading...' : 'Create Magic'}
          </NeoButton>
        </motion.div>
      </main>
    </div>
  );
}

