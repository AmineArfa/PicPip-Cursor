'use client';

import { forwardRef, type ReactNode, type MouseEventHandler } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type NeoCardVariant = 'default' | 'primary' | 'cyan' | 'lime';

interface NeoCardProps {
  variant?: NeoCardVariant;
  hover?: boolean;
  badge?: {
    text: string;
    icon?: ReactNode;
    variant?: 'gold' | 'white';
  };
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const variantStyles: Record<NeoCardVariant, string> = {
  default: 'bg-white',
  primary: 'bg-[#ff61d2]',
  cyan: 'bg-[#00ffff]',
  lime: 'bg-[#a3ff00]',
};

export const NeoCard = forwardRef<HTMLDivElement, NeoCardProps>(
  ({ variant = 'default', hover = true, badge, children, className, onClick }, ref) => {
    const baseClassName = cn(
      'relative flex flex-col rounded-3xl border-4 border-[#181016] p-6',
      'shadow-[6px_6px_0px_0px_#181016]',
      hover && 'cursor-pointer transition-shadow',
      variantStyles[variant],
      className
    );

    const content = (
      <>
        {badge && (
          <div
            className={cn(
              'absolute -top-5 left-1/2 -translate-x-1/2 z-10',
              'border-4 border-[#181016] px-4 py-2 rounded-full',
              'text-sm font-extrabold uppercase tracking-wider whitespace-nowrap',
              'flex items-center gap-1',
              badge.variant === 'gold'
                ? 'bg-[#FFD700] text-[#181016]'
                : 'bg-white text-[#181016]'
            )}
          >
            {badge.icon}
            {badge.text}
          </div>
        )}
        {children}
      </>
    );

    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={baseClassName}
          whileHover={{ y: -8, boxShadow: '10px 10px 0px 0px #181016' }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={onClick}
        >
          {content}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClassName} onClick={onClick}>
        {content}
      </div>
    );
  }
);

NeoCard.displayName = 'NeoCard';
