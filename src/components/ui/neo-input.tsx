'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type NeoInputSize = 'md' | 'lg' | 'xl';

interface NeoInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: NeoInputSize;
  icon?: ReactNode;
  error?: string;
  label?: string;
}

const sizeStyles: Record<NeoInputSize, string> = {
  md: 'h-14 text-lg pl-12 pr-4',
  lg: 'h-20 text-xl pl-16 pr-6',
  xl: 'h-24 text-2xl sm:text-3xl pl-20 pr-8',
};

const iconSizeStyles: Record<NeoInputSize, string> = {
  md: 'left-4 text-2xl',
  lg: 'left-5 text-3xl',
  xl: 'left-6 text-4xl',
};

export const NeoInput = forwardRef<HTMLInputElement, NeoInputProps>(
  ({ size = 'md', icon, error, label, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-2xl sm:text-3xl font-extrabold text-[#181016] mb-3 ml-4">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-[#181016]/40 pointer-events-none',
                iconSizeStyles[size]
              )}
            >
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-full border-4 border-[#181016] bg-white font-bold',
              'placeholder:text-[#181016]/30',
              'focus:outline-none focus:ring-0 focus:border-[#ff61d2]',
              'shadow-[6px_6px_0px_0px_#181016] transition-all',
              'hover:shadow-[8px_8px_0px_0px_#181016]',
              sizeStyles[size],
              error && 'border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 ml-4 text-red-500 font-bold text-sm">{error}</p>
        )}
      </div>
    );
  }
);

NeoInput.displayName = 'NeoInput';

