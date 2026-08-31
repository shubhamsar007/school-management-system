import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        active:    'bg-[#d8e9de] text-[#33604a]',
        pending:   'bg-[#f2e0d2] text-[#8e5334]',
        inactive:  'bg-[#fde8e7] text-[#b3261e]',
        left:      'bg-[#fde8e7] text-[#b3261e]',
        graduated: 'bg-[#dfeaf1] text-[#3d6678]',
        default:   'bg-[#ede9df] text-[#6d746e]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      style={{
        height: '20px',
        padding: '0 8px',
        borderRadius: '10px',
        fontSize: '10.5px',
        fontWeight: 700,
      }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
