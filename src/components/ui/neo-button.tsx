'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export type NeoButtonVariant = 'primary' | 'secondary' | 'cyan' | 'lime' | 'white' | 'black';
export type NeoButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface NeoButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: NeoButtonVariant;
  size?: NeoButtonSize;
  pulse?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<NeoButtonVariant, string> = {
  primary: 'bg-[#ff61d2] text-white hover:bg-[#ff7dd9]',
  secondary: 'bg-[#2962ff] text-white hover:bg-[#4479ff]',
  cyan: 'bg-[#00ffff] text-[#181016] hover:bg-[#33ffff]',
  lime: 'bg-[#a3ff00] text-[#181016] hover:bg-[#b5ff33]',
  white: 'bg-white text-[#181016] hover:bg-gray-50',
  black: 'bg-[#181016] text-white hover:bg-[#2a1f27]',
};

const sizeStyles: Record<NeoButtonSize, string> = {
  sm: 'h-10 px-4 text-sm font-bold',
  md: 'h-14 px-6 text-lg font-bold',
  lg: 'h-16 px-8 text-xl font-extrabold',
  xl: 'h-20 md:h-24 px-10 text-2xl md:text-3xl font-black',
};

const shadowSizes: Record<NeoButtonSize, { shadow: string; translate: string }> = {
  sm: { shadow: '3px 3px 0px 0px #181016', translate: 'translate-x-[3px] translate-y-[3px]' },
  md: { shadow: '4px 4px 0px 0px #181016', translate: 'translate-x-1 translate-y-1' },
  lg: { shadow: '5px 5px 0px 0px #181016', translate: 'translate-x-[5px] translate-y-[5px]' },
  xl: { shadow: '6px 6px 0px 0px #181016', translate: 'translate-x-1.5 translate-y-1.5' },
};

export const NeoButton = forwardRef<HTMLButtonElement, NeoButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pulse = false,
      icon,
      iconPosition = 'left',
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const shadowConfig = shadowSizes[size];

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative group w-full cursor-pointer',
          pulse && 'animate-pulse-slow hover:animate-none',
          disabled && 'opacity-60 cursor-not-allowed',
          className
        )}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        disabled={disabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {/* Shadow Layer */}
        <div 
          className={cn(
            'absolute inset-0 rounded-full bg-[#181016]',
            shadowConfig.translate
          )} 
        />
        
        {/* Button Content */}
        <div
          className={cn(
            'relative flex items-center justify-center gap-3 w-full rounded-full border-4 border-[#181016] transition-colors',
            variantStyles[variant],
            sizeStyles[size]
          )}
        >
          {icon && iconPosition === 'left' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
          <span className="font-display uppercase tracking-wide">{children}</span>
          {icon && iconPosition === 'right' && (
            <span className="flex-shrink-0">{icon}</span>
          )}
        </div>
      </motion.button>
    );
  }
);

NeoButton.displayName = 'NeoButton';

