import * as React from 'react';
import { cn } from '@/lib/utils';

const COLOR_PAIRS: Array<{ bg: string; fg: string }> = [
  { bg: '#dbeafe', fg: '#1e40af' }, // blue
  { bg: '#dcfce7', fg: '#166534' }, // green
  { bg: '#fef3c7', fg: '#92400e' }, // amber
  { bg: '#ede9fe', fg: '#5b21b6' }, // purple
  { bg: '#fce7f3', fg: '#9d174d' }, // pink
  { bg: '#e0f2fe', fg: '#0369a1' }, // sky
];

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 0) return '?';
  const first = words[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1] ?? '') : '';
  if (!last) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + (name.charCodeAt(i) ?? 0)) % COLOR_PAIRS.length;
  }
  return Math.abs(hash) % COLOR_PAIRS.length;
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
  bg?: string;
  fg?: string;
  className?: string;
}

function Avatar({ name, size = 'md', bg, fg, className }: AvatarProps) {
  const initials = getInitials(name);
  const colorIdx = hashName(name);
  const colors = COLOR_PAIRS[colorIdx] ?? COLOR_PAIRS[0]!;
  const backgroundColor = bg ?? colors.bg;
  const color = fg ?? colors.fg;

  const dimension = size === 'sm' ? 28 : 34;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <span
      className={cn('inline-flex items-center justify-center rounded-full font-semibold select-none flex-shrink-0', className)}
      style={{
        width: dimension,
        height: dimension,
        fontSize,
        backgroundColor,
        color,
      }}
      aria-label={name}
    >
      {initials}
    </span>
  );
}

export { Avatar };
