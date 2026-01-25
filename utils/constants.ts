export const TAB_KEYWORDS = 'keywords';
export const TAB_SONGS = 'songs';
export const TAB_ARTISTS = 'artists';
export const TAB_AI_DB = 'aidb';

export type TabType = typeof TAB_KEYWORDS | typeof TAB_SONGS | typeof TAB_ARTISTS | typeof TAB_AI_DB;

export const STORAGE_KEY_KEYWORDS = 'local:blockedKeywords';
export const STORAGE_KEY_SONGS = 'local:blockedTracks';
export const STORAGE_KEY_ARTISTS = 'local:blockedArtists';
export const STORAGE_KEY_AI_DB = 'local:aiDb';
export const STORAGE_KEY_AI_DB_TIMESTAMP = 'local:aiDbTimestamp';
export const STORAGE_KEY_AUTO_SKIP = 'sync:autoSkip';

export const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
