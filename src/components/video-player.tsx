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
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
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

        {/* Watermark Overlay */}
        {showWatermark && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Semi-transparent overlay */}
            <div className="absolute top-4 right-4 bg-[#ff61d2] text-white text-sm font-bold px-3 py-1 rounded-full border-2 border-[#181016] shadow-md">
              {watermarkText}
            </div>
            
            {/* Diagonal watermark pattern */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="watermark"
                    x="0"
                    y="0"
                    width="200"
                    height="200"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(-30)"
                  >
                    <text
                      x="0"
                      y="20"
                      className="fill-[#181016] text-2xl font-bold"
                    >
                      PicPip.co
                    </text>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#watermark)" />
              </svg>
            </div>
          </div>
        )}

        {/* Play/Pause Overlay Button */}
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

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-[#ff61d2] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls Bar */}
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
    </motion.div>
  );
}

