import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-semibold whitespace-nowrap',
  {
    variants: {
      variant: {
        active: 'bg-[#e8f6ee] text-[#146b41]',
        pending: 'bg-[#fdf3e0] text-[#8a5a00]',
        inactive: 'bg-[#fdeceb] text-[#b3261e]',
        left: 'bg-[#fdeceb] text-[#b3261e]',
        graduated: 'bg-[#eef1fd] text-[#3b45a8]',
        default: 'bg-[#f2f4f6] text-[#6b7480]',
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
        height: '22px',
        padding: '0 9px',
        borderRadius: '11px',
        fontSize: '11px',
        fontWeight: 600,
      }}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
