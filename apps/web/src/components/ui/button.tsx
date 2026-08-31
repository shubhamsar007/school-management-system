'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 font-semibold transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-nowrap',
  {
    variants: {
      variant: {
        primary:
          'bg-[#5d7f6b] text-[#fdfcf8] hover:bg-[#4a6a56]',
        secondary:
          'bg-[#fffdf8] text-[#2c322f] border border-[#ded9cc] hover:bg-[#f4f1e9] hover:border-[#c8c3b3]',
        ghost:
          'bg-transparent text-[#6d746e] hover:bg-[#f4f1e9] hover:text-[#2c322f]',
        danger:
          'bg-[#b3261e] text-white hover:bg-[#9a1f18]',
      },
      size: {
        default: 'h-[34px] px-3.5 text-[12.5px] rounded-[10px]',
        sm: 'h-[28px] px-3 text-[12px] rounded-[8px]',
        icon: 'h-[34px] w-[34px] rounded-[10px]',
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
