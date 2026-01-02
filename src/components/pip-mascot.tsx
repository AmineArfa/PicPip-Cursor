'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export type MascotVariant = 
  | 'frame'      // Holding picture frame (home page)
  | 'tablet'     // Holding tablet (subscribed home)
  | 'board'      // Holding board (trial home)
  | 'happy'      // Happy expression (celebration)
  | 'thinking';  // Processing state

export type MascotSize = 'sm' | 'md' | 'lg' | 'xl';

interface PipMascotProps {
  variant?: MascotVariant;
  size?: MascotSize;
  animate?: boolean;
  className?: string;
}

const sizeClasses: Record<MascotSize, string> = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-48 h-48 md:w-64 md:h-64',
  xl: 'w-64 h-64 md:w-80 md:h-80',
};

// Placeholder mascot using an SVG representation
// In production, replace with actual mascot images
function MascotSVG({ variant }: { variant: MascotVariant }) {
  // Blue bird mascot SVG representation
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Body */}
      <ellipse cx="50" cy="55" rx="35" ry="38" fill="#4ECDC4" />
      
      {/* Head tuft */}
      <path d="M50 12 L47 25 L53 25 Z" fill="#4ECDC4" />
      <path d="M45 15 L43 27 L49 27 Z" fill="#3DBDB4" />
      
      {/* Eyes */}
      <circle cx="38" cy="45" r="10" fill="white" />
      <circle cx="62" cy="45" r="10" fill="white" />
      <circle cx="40" cy="45" r="5" fill="#181016" />
      <circle cx="64" cy="45" r="5" fill="#181016" />
      <circle cx="42" cy="43" r="2" fill="white" />
      <circle cx="66" cy="43" r="2" fill="white" />
      
      {/* Beak */}
      <path d="M50 52 L45 58 L50 62 L55 58 Z" fill="#FFA500" />
      
      {/* Wings */}
      <ellipse cx="20" cy="60" rx="12" ry="20" fill="#3DBDB4" />
      <ellipse cx="80" cy="60" rx="12" ry="20" fill="#3DBDB4" />
      
      {/* Feet */}
      <rect x="38" y="88" width="4" height="10" fill="#FFA500" />
      <rect x="44" y="88" width="4" height="10" fill="#FFA500" />
      <rect x="52" y="88" width="4" height="10" fill="#FFA500" />
      <rect x="58" y="88" width="4" height="10" fill="#FFA500" />
      
      {/* Variant-specific elements */}
      {variant === 'frame' && (
        <rect x="30" y="60" width="40" height="30" fill="#CD853F" stroke="#8B4513" strokeWidth="3" rx="2" />
      )}
      {variant === 'tablet' && (
        <rect x="28" y="58" width="44" height="32" fill="#333" stroke="#181016" strokeWidth="2" rx="3" />
      )}
      {variant === 'happy' && (
        <>
          <path d="M35 70 Q50 80 65 70" stroke="#181016" strokeWidth="2" fill="none" />
        </>
      )}
    </svg>
  );
}

export function PipMascot({
  variant = 'frame',
  size = 'lg',
  animate = true,
  className,
}: PipMascotProps) {
  const content = (
    <div
      className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      {/* Decorative circle behind mascot */}
      <div className="absolute inset-0 bg-white rounded-full border-4 border-[#181016] shadow-[6px_6px_0px_0px_#181016] transform -rotate-3" />
      
      {/* Mascot container */}
      <div className="absolute inset-2 z-10 rounded-full overflow-hidden bg-sky-100 flex items-center justify-center">
        <MascotSVG variant={variant} />
      </div>
    </div>
  );

  if (animate) {
    return (
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Speech bubble component for mascot
interface SpeechBubbleProps {
  children: React.ReactNode;
  className?: string;
}

export function SpeechBubble({ children, className }: SpeechBubbleProps) {
  return (
    <div
      className={cn(
        'relative bg-white border-4 border-[#181016] rounded-2xl p-4 shadow-[4px_4px_0px_0px_#181016]',
        className
      )}
    >
      {children}
      {/* Speech bubble tail */}
      <div className="absolute -left-4 top-1/2 -translate-y-1/2">
        <div className="w-0 h-0 border-t-[12px] border-t-transparent border-r-[16px] border-r-[#181016] border-b-[12px] border-b-transparent" />
        <div className="absolute left-[5px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[10px] border-t-transparent border-r-[14px] border-r-white border-b-[10px] border-b-transparent" />
      </div>
    </div>
  );
}

