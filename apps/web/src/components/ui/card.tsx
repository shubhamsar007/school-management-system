'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: boolean;
  bg?: string;
  onClick?: () => void;
}

function Card({ children, className, style, padding = true, bg, onClick }: CardProps) {
  return (
    <div
      className={cn(onClick && 'cursor-pointer', className)}
      style={{
        background: bg ?? '#fffdf8',
        border: '1px solid #e6e1d5',
        borderRadius: 18,
        padding: padding ? '18px 20px' : 0,
        transition: onClick ? 'box-shadow 150ms' : undefined,
        overflow: 'hidden',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={
        onClick
          ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(44,50,47,0.10)'; }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-row items-center justify-between', className)} style={{ marginBottom: 16 }}>
      {children}
    </div>
  );
}

function CardTitle({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <h3
      className={cn(className)}
      style={{
        fontFamily: 'var(--font-fraunces)',
        fontSize: '14.5px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        color: '#2c322f',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </h3>
  );
}

export { Card, CardHeader, CardTitle };
