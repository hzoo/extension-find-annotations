export interface Tweet {
  tweet_id: string;
  full_text: string;
  created_at: string;
  account_id: string;
  retweet_count: number;
  favorite_count: number;
  reply_to_tweet_id: string | null;
  reply_to_user_id: string | null;
  reply_to_username: string | null;
}

export interface Settings {
  enabledDomains: string[];
  allowAllDomains: boolean;
}

/**
 * Common types for content across different services
 */

// Generic content item interface all services should implement
export interface ContentItem {
  id: string;
  text: string;
  created_at: string;
  creator_id: string;
  creator_username?: string;
  updated_at?: string;
  reply_to_id?: string | null;
  reply_to_creator_id?: string | null;
  type?: string;
  service: ServiceType;
  url?: string;
  media?: MediaItem[];
  metadata?: Record<string, unknown>;
}

export interface MediaItem {
  type: string;
  url: string;
  id: string;
  alt_text?: string;
}

// Service types
export enum ServiceType {
  TWITTER = "twitter",
  BLUESKY = "bluesky",
  ARENA = "arena",
  OBSIDIAN = "obsidian"
}

export interface ServiceConfig {
  id: ServiceType;
  name: string;
  description: string;
  enabled: boolean;
  icon?: string;
  apiKey?: string;
  apiEndpoint?: string;
}

// Cache entry type
export interface CacheEntry {
  items: ContentItem[];
  timestamp: number;
  service: ServiceType;
}

// Interface that every service provider must implement
export interface ServiceProvider {
  type: ServiceType;
  name: string;
  findContentForUrl(url: string, forceRefresh?: boolean): Promise<ContentItem[]>;
  renderItem(item: ContentItem): preact.JSX.Element;
  getDefaultConfig(): ServiceConfig;
} 