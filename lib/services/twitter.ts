import { supabase } from "@/lib/supabase";
import type { ContentItem, ServiceConfig } from "@/lib/types";
import { ServiceType } from "@/lib/types";
import type { ServiceProvider } from "@/lib/types";
import type { TweetData, TweetUrl } from "@/lib/signals";
import { determineTweetType, TweetType } from "@/lib/signals";
import { getCachedTweets, cacheTweets, isCacheStale } from "@/lib/urlCache";
import { Tweet } from "@/components/Tweet";
import { h } from "preact";

// Convert Twitter-specific data to generic ContentItem
function convertTweetToContentItem(tweet: TweetData): ContentItem {
  return {
    id: tweet.tweet_id,
    text: tweet.full_text,
    created_at: tweet.created_at,
    creator_id: tweet.account_id,
    creator_username: tweet.reply_to_username || undefined,
    updated_at: tweet.updated_at,
    reply_to_id: tweet.reply_to_tweet_id,
    reply_to_creator_id: tweet.reply_to_user_id,
    type: tweet.type,
    service: ServiceType.TWITTER,
    metadata: {
      original_tweet: tweet
    }
  };
}

// Twitter Service Provider implementation
export class TwitterServiceProvider implements ServiceProvider {
  type = ServiceType.TWITTER;
  name = "Twitter";
  
  async findContentForUrl(url: string, forceRefresh = false): Promise<ContentItem[]> {
    try {
      // Check cache first if we're not forcing a refresh
      if (!forceRefresh) {
        const cached = getCachedTweets(url);
        if (cached && !isCacheStale(url)) {
          return cached.tweets.map(convertTweetToContentItem);
        }
      }

      // Try both with and without trailing slash
      const hasSlash = url.endsWith('/');
      const urlWithSlash = hasSlash ? url : `${url}/`;
      const urlWithoutSlash = hasSlash ? url.slice(0, -1) : url;

      // Search for both variants at once
      const { data: urlData, error: urlError } = await supabase
        .from('tweet_urls')
        .select('tweet_id, url, expanded_url')
        .or(`expanded_url.eq.${urlWithSlash},expanded_url.eq.${urlWithoutSlash}`)
        .limit(50);

      if (urlError) throw urlError;

      if (!urlData?.length) {
        // Cache empty results too
        cacheTweets(url, []);
        return [];
      }

      const tweetIds = urlData.map(d => d.tweet_id);

      // Then get the full tweet data
      const { data: tweets, error: tweetsError } = await supabase
        .from('tweets')
        .select('tweet_id, full_text, created_at, account_id, reply_to_tweet_id, reply_to_user_id, reply_to_username, updated_at')
        .in('tweet_id', tweetIds)
        .order('created_at', { ascending: false });
        
      if (tweetsError) throw tweetsError;
      
      const processedTweets = this.processTweets(tweets || [], urlData);
      
      // Cache the results
      cacheTweets(url, processedTweets);
      
      return processedTweets.map(convertTweetToContentItem);
    } catch (error) {
      console.error("[Twitter Service] Error finding tweets:", error);
      return [];
    }
  }
  
  // Process tweets similar to the existing processTweets function
  processTweets(tweetData: TweetData[], tweetUrls?: TweetUrl[]): TweetData[] {
    const urlsByTweetId = new Map<string, TweetUrl[]>();
    
    // Group URLs by tweet_id for efficient lookup
    if (tweetUrls?.length) {
      tweetUrls.forEach(url => {
        const urls = urlsByTweetId.get(url.tweet_id) || [];
        urls.push(url);
        urlsByTweetId.set(url.tweet_id, urls);
      });
    }
    
    return tweetData.map(tweet => {
      const type = determineTweetType(tweet);
      const urls = urlsByTweetId.get(tweet.tweet_id) || [];
      
      // Replace t.co URLs in the tweet text with their expanded versions
      let processedText = tweet.full_text;
      urls.forEach(({ url, expanded_url }) => {
        if (url.includes('t.co/')) {
          // Use a regex that matches the URL with optional punctuation at the end
          const urlRegex = new RegExp(`${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[.,;:]*`, 'g');
          processedText = processedText.replace(urlRegex, expanded_url);
        }
      });
      
      // Check if any of the URLs are to twitter.com/*/status/* which would indicate a quote tweet
      const isTwitterStatusUrl = (url: string): boolean => {
        return /(twitter\.com|x\.com)\/\w+\/status\/\d+/i.test(url);
      };
      
      if (type === TweetType.STANDALONE && urls.some(url => isTwitterStatusUrl(url.expanded_url))) {
        return { ...tweet, full_text: processedText, type: TweetType.QUOTE_RETWEET };
      }
      
      return { ...tweet, full_text: processedText, type };
    });
  }
  
  renderItem(item: ContentItem): preact.JSX.Element {
    // Convert ContentItem back to TweetData for rendering
    const tweetData = item.metadata?.original_tweet as TweetData || {
      tweet_id: item.id,
      full_text: item.text,
      created_at: item.created_at,
      account_id: item.creator_id,
      reply_to_tweet_id: item.reply_to_id,
      reply_to_user_id: item.reply_to_creator_id,
      reply_to_username: item.creator_username || null,
      updated_at: item.updated_at,
      type: item.type as TweetType
    };
    
    return h(Tweet, { tweet: tweetData });
  }
  
  getDefaultConfig(): ServiceConfig {
    return {
      id: ServiceType.TWITTER,
      name: "Twitter",
      description: "Display tweets related to the current page",
      enabled: true
    };
  }
} 