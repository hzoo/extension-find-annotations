// Simple cache for t.co -> expanded URL mappings
export const urlCache = new Map<string, string>();

// Helper to get expanded URL
export function getExpandedUrl(url: string) {
  return urlCache.get(url);
}

// Helper to set expanded URLs
export function setExpandedUrls(urls: { url: string; expanded_url: string }[]) {
  for (const { url, expanded_url } of urls) {
    if (expanded_url) urlCache.set(url, expanded_url);
  }
} 