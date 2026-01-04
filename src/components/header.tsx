'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User, HelpCircle, Zap, Infinity as InfinityIcon, Clapperboard, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePicPipStore } from '@/lib/store';

interface HeaderProps {
  variant?: 'default' | 'minimal';
  showNav?: boolean;
  isAuthenticated?: boolean;
  isSubscribed?: boolean;
  credits?: number;
  step?: { current: number; total: number };
}

// Credit bar component that shows credits with a visual bar
function CreditBar({ credits, isSubscribed }: { credits: number; isSubscribed: boolean }) {
  // Also read from store for real-time updates
  const storeCredits = usePicPipStore((state) => state.credits);
  const storeIsSubscribed = usePicPipStore((state) => state.isSubscribed);
  
  // Use store value if it's been set (non-zero or subscribed), otherwise use props
  const displayCredits = storeCredits > 0 || storeIsSubscribed ? storeCredits : credits;
  const displaySubscribed = storeIsSubscribed || isSubscribed;
  
  // For non-subscribers, show credits out of 10 (max bundle size)
  // For subscribers, show full bar with infinity icon
  const maxCredits = 10;
  const percentage = displaySubscribed ? 100 : Math.min((displayCredits / maxCredits) * 100, 100);
  
  return (
    <Link
      href="/pricing"
      className="group flex items-center gap-2 px-3 py-1.5 bg-white border-3 border-[#181016] rounded-full hover:shadow-[3px_3px_0_0_#181016] hover:-translate-y-0.5 transition-all cursor-pointer"
    >
      <Zap className="w-4 h-4 text-[#ff61d2] flex-shrink-0" />
      
      {/* Credit bar container */}
      <div className="relative w-16 sm:w-20 h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[#181016]">
        <motion.div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full",
            displaySubscribed 
              ? "bg-gradient-to-r from-[#ff61d2] via-[#a3ff00] to-[#00d4ff]"
              : displayCredits > 0 
                ? "bg-gradient-to-r from-[#ff61d2] to-[#ff8de0]"
                : "bg-gray-300"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
        
        {/* Shimmer effect for unlimited */}
        {displaySubscribed && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        )}
      </div>
      
      {/* Credit text */}
      <span className="font-bold text-sm text-[#181016] flex items-center gap-1 min-w-[2.5rem]">
        {displaySubscribed ? (
          <>
            <InfinityIcon className="w-4 h-4" />
          </>
        ) : (
          <span>{displayCredits}</span>
        )}
      </span>
    </Link>
  );
}

export function Header({
  variant = 'default',
  showNav = true,
  isAuthenticated = false,
  isSubscribed = false,
  credits = 0,
  step,
}: HeaderProps) {
  return (
    <header className="w-full border-b-4 border-[#181016] bg-white px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 shadow-[0_4px_0_0_#181016]">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo - Hidden on mobile */}
        <Link
          href="/"
          className="select-none group hidden md:block"
        >
          <div className="relative h-16 w-48 lg:h-20 lg:w-56 group-hover:scale-105 transition-transform">
            <Image
              src="/picpip_logo.svg"
              alt="PicPip"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Mobile Navigation - Home + Credit badge + 3 icons */}
        {showNav && variant === 'default' && (
          <nav className="flex md:hidden items-center justify-between w-full gap-2">
            {/* Home + Credit Bar */}
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-2.5 rounded-full hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-[#181016]"
                aria-label="Home"
              >
                <Home className="w-5 h-5 text-[#181016]" />
              </Link>
              {isAuthenticated && (
                <CreditBar credits={credits} isSubscribed={isSubscribed} />
              )}
              {!isAuthenticated && (
                <Link
                  href="/pricing"
                  className="flex items-center gap-2 px-3 py-1.5 bg-[#ff61d2] border-3 border-[#181016] rounded-full text-white font-bold text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Credits</span>
                </Link>
              )}
            </div>
            
            {/* Icon buttons */}
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <Link
                  href="/memories"
                  className="p-2.5 rounded-full hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-[#181016]"
                  aria-label="My Memories"
                >
                  <Clapperboard className="w-5 h-5 text-[#181016]" />
                </Link>
              )}
              <Link
                href="/help"
                className="p-2.5 rounded-full hover:bg-gray-100 transition-colors border-2 border-transparent hover:border-[#181016]"
                aria-label="Help"
              >
                <HelpCircle className="w-5 h-5 text-[#181016]" />
              </Link>
              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className={cn(
                  'p-2.5 rounded-full transition-colors border-2',
                  isAuthenticated 
                    ? 'hover:bg-gray-100 border-transparent hover:border-[#181016]' 
                    : 'bg-[#ff61d2] border-[#181016]'
                )}
                aria-label={isAuthenticated ? 'My Account' : 'Sign In'}
              >
                <User className={cn('w-5 h-5', isAuthenticated ? 'text-[#181016]' : 'text-white')} />
              </Link>
            </div>
          </nav>
        )}

        {/* Desktop Navigation */}
        {showNav && variant === 'default' && (
          <nav className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <>
                <Link
                  href="/memories"
                  className="px-4 py-2 text-lg font-bold hover:text-[#ff61d2] transition-colors"
                >
                  My Memories
                </Link>
                {!isSubscribed && (
                  <Link
                    href="/pricing"
                    className="px-4 py-2 text-lg font-bold text-[#ff61d2] hover:text-[#2962ff] transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
                {/* Credit Bar */}
                <CreditBar credits={credits} isSubscribed={isSubscribed} />
              </>
            )}
            <Link
              href="/help"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Help"
            >
              <HelpCircle className="w-6 h-6" />
            </Link>
            <Link
              href={isAuthenticated ? '/account' : '/login'}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full border-3 border-[#181016]',
                'font-bold transition-all hover:shadow-[4px_4px_0_0_#181016]',
                isAuthenticated ? 'bg-white' : 'bg-[#ff61d2] text-white'
              )}
            >
              <User className="w-5 h-5" />
              <span className="hidden lg:inline">
                {isAuthenticated ? 'My Account' : 'Sign In'}
              </span>
            </Link>
          </nav>
        )}

        {/* Step Indicator */}
        {step && (
          <div className="hidden sm:block">
            <span className="text-lg font-bold">
              Step {step.current} of {step.total}
            </span>
          </div>
        )}

        {/* Subscribed Badge */}
        {isSubscribed && variant === 'default' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border-3 border-[#181016] rounded-full">
            <div className="w-5 h-5 rounded-full bg-[#a3ff00] flex items-center justify-center">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-sm uppercase tracking-wide">Unlimited Mode Active</span>
          </div>
        )}

      </div>
    </header>
  );
}

