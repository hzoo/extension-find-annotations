import type { TweetData, TweetUrl } from './signals';

// Tweet cache with timestamps
interface TweetCacheEntry {
  tweets: TweetData[];
  timestamp: number; // Unix timestamp in milliseconds
}

// LocalStorage key prefix
const CACHE_PREFIX = 'tweet_cache_';

// In-memory LRU cache settings
const MAX_CACHED_URLS = 20; // Maximum number of URLs to keep in memory
const memoryCache = new Map<string, TweetCacheEntry>(); // In-memory cache (loaded on-demand)
const recentlyAccessed: string[] = []; // Track access order for LRU eviction

// Helper to check if a URL is a Twitter status URL
export function isTwitterStatusUrl(url: string): boolean {
  return /(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url);
}

// Get cached tweets for a URL (only loads from localStorage when needed)
export function getCachedTweets(url: string): TweetCacheEntry | undefined {
  // First check memory cache
  if (memoryCache.has(url)) {
    updateRecentlyAccessed(url);
    return memoryCache.get(url);
  }
  
  // Not in memory, try localStorage
  try {
    const item = localStorage.getItem(CACHE_PREFIX + url);
    if (item) {
      const cacheEntry = JSON.parse(item) as TweetCacheEntry;
      
      // Add to memory cache (with LRU eviction if needed)
      addToMemoryCache(url, cacheEntry);
      
      return cacheEntry;
    }
  } catch (e) {
    console.error('[Tweet Cache] Error reading from localStorage:', e);
  }
  
  return undefined;
}

// Save tweets for a URL in the cache
export function cacheTweets(url: string, tweets: TweetData[]): void {
  const cacheEntry = {
    tweets,
    timestamp: Date.now()
  };
  
  // Update in-memory cache with LRU eviction if needed
  addToMemoryCache(url, cacheEntry);
  
  // Persist to localStorage
  try {
    localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(cacheEntry));
  } catch (e) {
    console.warn('[Tweet Cache] Error saving to localStorage:', e);
    // If we hit quota limit, clean up older entries
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      pruneOldCache();
      try {
        localStorage.setItem(CACHE_PREFIX + url, JSON.stringify(cacheEntry));
      } catch (e2) {
        console.error('[Tweet Cache] Still could not save after pruning:', e2);
      }
    }
  }
}

// Add to memory cache with LRU eviction if needed
function addToMemoryCache(url: string, cacheEntry: TweetCacheEntry): void {
  // Add/update in memory cache
  memoryCache.set(url, cacheEntry);
  updateRecentlyAccessed(url);
  
  // If we've exceeded the max size, remove least recently used item
  if (memoryCache.size > MAX_CACHED_URLS && recentlyAccessed.length > MAX_CACHED_URLS) {
    const oldestUrl = recentlyAccessed.pop(); // Get least recently used
    if (oldestUrl) {
      memoryCache.delete(oldestUrl);
      console.log(`[Tweet Cache] Evicted ${oldestUrl} from memory cache (LRU)`);
    }
  }
}

// Update recently accessed list (for LRU tracking)
function updateRecentlyAccessed(url: string): void {
  // Remove if already in list
  const index = recentlyAccessed.indexOf(url);
  if (index > -1) {
    recentlyAccessed.splice(index, 1);
  }
  
  // Add to front of list (most recently used)
  recentlyAccessed.unshift(url);
}

// Remove a URL from cache
export function removeCachedTweets(url: string): void {
  memoryCache.delete(url);
  
  // Remove from recently accessed
  const index = recentlyAccessed.indexOf(url);
  if (index > -1) {
    recentlyAccessed.splice(index, 1);
  }
  
  try {
    localStorage.removeItem(CACHE_PREFIX + url);
  } catch (e) {
    console.error('[Tweet Cache] Error removing from localStorage:', e);
  }
}

// Clear all cached tweets
export function clearAllCachedTweets(): void {
  try {
    // Clear in-memory cache
    memoryCache.clear();
    recentlyAccessed.length = 0;
    
    // Clear localStorage items with our prefix
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[Tweet Cache] Cleared ${keysToRemove.length} cached URL entries`);
  } catch (e) {
    console.error('[Tweet Cache] Error clearing cache:', e);
  }
}

// Get stats about the cache
export function getCacheStats(): { memoryEntries: number, storageEntries: number } {
  let storageEntries = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        storageEntries++;
      }
    }
  } catch (e) {
    console.error('[Tweet Cache] Error counting localStorage entries:', e);
  }
  
  return {
    memoryEntries: memoryCache.size,
    storageEntries
  };
}

// Prune old cache entries to free up space
function pruneOldCache() {
  try {
    console.log('[Tweet Cache] Pruning older cache entries...');
    const keys = [];
    const now = Date.now();
    
    // Collect all tweet cache keys with their timestamps
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const { timestamp } = JSON.parse(item) as TweetCacheEntry;
            keys.push({ key, timestamp, age: now - timestamp });
          } catch (e) {
            // Invalid entry, just remove it
            localStorage.removeItem(key);
          }
        }
      }
    }
    
    // Sort by age (oldest first) and remove the oldest 30%
    keys.sort((a, b) => b.age - a.age);
    const toRemove = Math.max(1, Math.floor(keys.length * 0.3));
    
    keys.slice(0, toRemove).forEach(({ key }) => {
      localStorage.removeItem(key);
      // Also remove from memory cache if present
      const url = key.slice(CACHE_PREFIX.length);
      memoryCache.delete(url);
      
      // Remove from recently accessed
      const index = recentlyAccessed.indexOf(url);
      if (index > -1) {
        recentlyAccessed.splice(index, 1);
      }
    });
    
    console.log(`[Tweet Cache] Removed ${toRemove} older cache entries`);
  } catch (e) {
    console.error('[Tweet Cache] Error pruning cache:', e);
  }
}

// Check if cached tweets for a URL are stale (older than maxAge)
export function isCacheStale(url: string, maxAgeMs = 2592000000): boolean { // Default: 30 days (1 month)
  const cached = getCachedTweets(url); // This now loads from localStorage if needed
  if (!cached) return true;
  
  const now = Date.now();
  return (now - cached.timestamp) > maxAgeMs;
}

// Format timestamp for display
export function formatCacheTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
} 