'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  onClick?: () => void;
}

function Card({ children, className, padding = true, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-[#e6e8eb] rounded-xl',
        padding && 'p-5',
        onClick && 'cursor-pointer',
        className,
      )}
      style={{
        borderRadius: '12px',
        boxShadow: onClick
          ? undefined
          : '0 1px 2px rgba(20,24,28,0.04)',
      }}
      onClick={onClick}
      onMouseEnter={
        onClick
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 4px 12px rgba(20,24,28,0.08)';
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => {
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                '0 1px 2px rgba(20,24,28,0.04)';
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div
      className={cn('flex flex-row items-center justify-between mb-4', className)}
    >
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3
      className={cn(className)}
      style={{ fontSize: '14px', fontWeight: 600, color: '#14181c', margin: 0 }}
    >
      {children}
    </h3>
  );
}

export { Card, CardHeader, CardTitle };
