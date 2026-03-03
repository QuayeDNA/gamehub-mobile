import { getCategoryMeta } from '../services/gameApi';

/**
 * Get the emoji icon for a game category.
 * Safely handles null, arrays, and non-string values.
 */
export function getCategoryIcon(category) {
  if (!category) return '🎮';
  const s = typeof category === 'string' ? category : Array.isArray(category) ? category[0] : String(category);
  if (!s) return '🎮';
  return getCategoryMeta(s.toLowerCase().trim())?.icon || '🎮';
}

/**
 * Format seconds into a human-readable duration.
 */
export function formatDuration(minutes) {
  if (!minutes || minutes < 1) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}
