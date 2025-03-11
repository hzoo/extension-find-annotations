import type { TweetUrl } from './signals';

// We'll use a WeakMap with objects as keys since WeakMap only accepts objects
interface UrlKey {
  url: string;
}

// Using WeakMap so entries can be garbage collected when no longer referenced
const urlKeyMap = new Map<string, UrlKey>();
const urlCache = new WeakMap<UrlKey, string>();

// Helper to get expanded URL
export function getExpandedUrl(shortUrl: string): string | undefined {
  const key = urlKeyMap.get(shortUrl);
  if (!key) return undefined;
  return urlCache.get(key);
}

// Helper to set expanded URLs
export function setExpandedUrls(urls: TweetUrl[]) {
  for (const { url, expanded_url } of urls) {
    if (!expanded_url) continue;
    
    // Create or reuse the key object
    let key = urlKeyMap.get(url);
    if (!key) {
      key = { url };
      urlKeyMap.set(url, key);
    }
    
    urlCache.set(key, expanded_url);
  }
}

// Helper to check if a URL is a Twitter status URL
export function isTwitterStatusUrl(url: string): boolean {
  return /(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url);
} 