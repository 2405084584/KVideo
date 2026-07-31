import type { FavoriteItem, VideoHistoryItem } from '@/lib/types';

function hasIdentity(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const record = value as { videoId?: unknown; source?: unknown; title?: unknown };
  const videoId = record.videoId;
  const hasVideoId = typeof videoId === 'string' ? videoId.length > 0 : typeof videoId === 'number';

  return hasVideoId && typeof record.source === 'string' && typeof record.title === 'string';
}

/**
 * Records restored from server-side sync are not guaranteed to be well formed —
 * they may come from an older schema or a partial write. Rendering one without
 * `videoId` throws while building the player URL, which takes down the whole
 * page, so anything lacking a usable identity is dropped on the way in.
 */
export function isRenderableHistoryItem(value: unknown): value is VideoHistoryItem {
  return hasIdentity(value);
}

export function isRenderableFavoriteItem(value: unknown): value is FavoriteItem {
  return hasIdentity(value);
}

export function keepRenderableHistory(items: unknown): VideoHistoryItem[] {
  return Array.isArray(items) ? items.filter(isRenderableHistoryItem) : [];
}

export function keepRenderableFavorites(items: unknown): FavoriteItem[] {
  return Array.isArray(items) ? items.filter(isRenderableFavoriteItem) : [];
}
