import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatDate(date: Date | string, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, pattern);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'dd MMM yyyy, hh:mm a');
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Get the current Indian academic year string (e.g., "2026-27")
 * Academic year in India runs April to March
 */
export function getCurrentAcademicYear(): string {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}
