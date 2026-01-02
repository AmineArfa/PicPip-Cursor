'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  showWatermark?: boolean;
  watermarkText?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onDownload?: () => void;
  className?: string;
  hideControls?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  showWatermark = false,
  watermarkText = 'PicPip.co',
  autoPlay = true,
  loop = true,
  onDownload,
  className,
  hideControls = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = () => {
    if (hideControls) return;
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    if (hideControls) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border-4 border-[#181016] overflow-hidden',
        'shadow-[8px_8px_0px_0px_#181016]',
        'bg-white',
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Video Container */}
      <div className="relative aspect-[4/5] sm:aspect-video bg-black">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />

        {/* AGGRESSIVE Watermark Overlay - Defeats screen recording */}
        {showWatermark && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Animated floating corner badges */}
            <motion.div 
              className="absolute top-3 right-3 bg-[#ff61d2] text-white text-base font-black px-4 py-1.5 rounded-full border-2 border-[#181016] shadow-[2px_2px_0_0_#181016] z-20"
              animate={{ 
                x: [0, 8, 0, -8, 0],
                y: [0, -5, 0, 5, 0],
                rotate: [0, 5, 0, -5, 0]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              PicPip.co
            </motion.div>
            
            <motion.div 
              className="absolute top-3 left-3 bg-[#a3ff00] text-[#181016] text-base font-black px-4 py-1.5 rounded-full border-2 border-[#181016] shadow-[2px_2px_0_0_#181016] z-20"
              animate={{ 
                x: [0, -8, 0, 8, 0],
                y: [0, 5, 0, -5, 0],
                rotate: [0, -5, 0, 5, 0]
              }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              PicPip.co
            </motion.div>
            
            <motion.div 
              className="absolute bottom-3 left-3 bg-[#ff61d2] text-white text-base font-black px-4 py-1.5 rounded-full border-2 border-[#181016] shadow-[2px_2px_0_0_#181016] z-20"
              animate={{ 
                x: [0, 10, 0, -10, 0],
                y: [0, -8, 0, 8, 0],
                scale: [1, 1.05, 1, 0.95, 1]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              PicPip.co
            </motion.div>
            
            <motion.div 
              className="absolute bottom-3 right-3 bg-[#a3ff00] text-[#181016] text-base font-black px-4 py-1.5 rounded-full border-2 border-[#181016] shadow-[2px_2px_0_0_#181016] z-20"
              animate={{ 
                x: [0, -10, 0, 10, 0],
                y: [0, 8, 0, -8, 0],
                scale: [1, 0.95, 1, 1.05, 1]
              }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              PicPip.co
            </motion.div>
            
            {/* Large animated center watermark - moves to defeat cropping */}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center z-10"
              animate={{ 
                x: [0, 20, 0, -20, 0],
                y: [0, -15, 0, 15, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div 
                className="text-white text-4xl sm:text-5xl md:text-6xl font-black select-none"
                style={{ 
                  textShadow: '3px 3px 0 #181016, -1px -1px 0 #181016, 1px -1px 0 #181016, -1px 1px 0 #181016',
                  WebkitTextStroke: '2px #181016'
                }}
                animate={{ 
                  opacity: [0.5, 0.7, 0.5],
                  rotate: [-15, -20, -15],
                  scale: [1, 1.02, 1]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                PicPip.co
              </motion.div>
            </motion.div>
            
            {/* Secondary floating watermark - different timing */}
            <motion.div 
              className="absolute top-1/4 left-1/4 z-10"
              animate={{ 
                x: [-30, 30, -30],
                y: [20, -20, 20],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            >
              <div 
                className="text-white text-2xl sm:text-3xl font-black rotate-[-30deg] select-none"
                style={{ textShadow: '2px 2px 0 #181016' }}
              >
                PicPip.co
              </div>
            </motion.div>
            
            {/* Third floating watermark */}
            <motion.div 
              className="absolute bottom-1/4 right-1/4 z-10"
              animate={{ 
                x: [20, -20, 20],
                y: [-30, 30, -30],
                opacity: [0.4, 0.6, 0.4]
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div 
                className="text-white text-2xl sm:text-3xl font-black rotate-[25deg] select-none"
                style={{ textShadow: '2px 2px 0 #181016' }}
              >
                PicPip.co
              </div>
            </motion.div>
            
            {/* Pulsing overlay strips - hard to edit out */}
            <motion.div 
              className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/30 to-transparent z-10"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/30 to-transparent z-10"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            />
            
            {/* Animated diagonal pattern overlay */}
            <motion.div 
              className="absolute inset-0 opacity-30 z-5"
              animate={{ opacity: [0.25, 0.35, 0.25] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="watermark-pattern"
                    x="0"
                    y="0"
                    width="150"
                    height="100"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-25)"
                  >
                    <text
                      x="0"
                      y="25"
                      fill="white"
                      style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'sans-serif' }}
                    >
                      PicPip.co
                    </text>
                    <text
                      x="75"
                      y="70"
                      fill="white"
                      style={{ fontSize: '14px', fontWeight: 'bold', fontFamily: 'sans-serif' }}
                    >
                      ✦ PREVIEW ✦
                    </text>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
              </svg>
            </motion.div>
            
            {/* Scanline effect - makes screen recording look bad */}
            <div 
              className="absolute inset-0 z-15 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
              }}
            />
          </div>
        )}

        {/* Play/Pause Overlay Button - hidden when controls disabled */}
        {!hideControls && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
          >
            <motion.div
              className={cn(
                'w-16 h-16 rounded-full bg-white/90 border-4 border-[#181016]',
                'flex items-center justify-center shadow-lg',
                'opacity-0 group-hover:opacity-100 transition-opacity',
                !isPlaying && 'opacity-100'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-[#181016]" />
              ) : (
                <Play className="w-6 h-6 text-[#181016] ml-1" />
              )}
            </motion.div>
          </button>
        )}

        {/* Progress Bar - only show when controls enabled */}
        {!hideControls && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
            <div
              className="h-full bg-[#ff61d2] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Controls Bar - hidden when controls disabled */}
      {!hideControls && (
        <div className="flex items-center justify-between p-3 bg-white border-t-4 border-[#181016]">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {onDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-[#a3ff00] rounded-full border-2 border-[#181016] font-bold text-sm hover:bg-[#b5ff33] transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

