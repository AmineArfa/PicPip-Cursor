'use client';

import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface DotPatternProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'light' | 'dense';
  children?: ReactNode;
}

export function DotPattern({
  variant = 'light',
  children,
  className,
  ...props
}: DotPatternProps) {
  return (
    <div
      className={cn(
        'min-h-screen w-full',
        variant === 'light' ? 'bg-pattern' : 'bg-pattern-dense',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

