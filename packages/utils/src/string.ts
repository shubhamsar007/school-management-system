/**
 * Get initials from a full name (e.g., "Rahul Sharma" → "RS")
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, maxChars)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * Convert snake_case or SCREAMING_SNAKE_CASE to Title Case
 */
export function enumToLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generate a slug from a string
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
