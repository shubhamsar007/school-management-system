'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[#2b5fa8] text-white hover:bg-[#24518f] focus-visible:ring-[#2b5fa8]',
        secondary:
          'bg-white text-[#14181c] border border-[#d7dce1] hover:bg-[#f8f9fa] focus-visible:ring-[#2b5fa8]',
        ghost:
          'bg-transparent text-[#14181c] hover:bg-[#f2f4f6] focus-visible:ring-[#2b5fa8]',
        danger:
          'bg-[#b3261e] text-white hover:bg-[#9a1f18] focus-visible:ring-[#b3261e]',
      },
      size: {
        default: 'h-9 px-3.5 text-sm rounded-md',
        sm: 'h-[30px] px-2.5 text-xs rounded-md',
        icon: 'h-9 w-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
