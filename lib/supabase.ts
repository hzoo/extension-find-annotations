import { createClient } from '@supabase/supabase-js';
// import { setExpandedUrls } from '@/lib/urlCache';
import { processTweets, loading } from './signals';
import { cacheTweets, getCachedTweets, isCacheStale } from './urlCache';

// Supabase setup
// const supabaseUrl = import.meta.env.VITE_LOCAL_SUPABASE_URL;
// const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function findTweetsForUrl(url: string, forceRefresh = false) {
  try {
    console.log("[Tweet Finder] Searching for URL:", url);

    // Check cache first if we're not forcing a refresh
    if (!forceRefresh) {
      const cached = getCachedTweets(url);
      if (cached && !isCacheStale(url)) {
        console.log("[Tweet Finder] Using cached tweets from", new Date(cached.timestamp).toLocaleString());
        return cached.tweets;
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
      console.log("[Tweet Finder] No tweets found with this URL");
      // Cache empty results too
      cacheTweets(url, []);
      return [];
    }

    // console.log("[Tweet Finder] Found URL matches:", urlData);
    const tweetIds = urlData.map(d => d.tweet_id);
    // console.log("[Tweet Finder] Found tweet IDs:", tweetIds);

    // Then get the full tweet data
    const { data: tweets, error: tweetsError } = await supabase
      .from('tweets')
      .select('tweet_id, full_text, created_at, account_id, reply_to_tweet_id, reply_to_user_id, reply_to_username, updated_at')
      .in('tweet_id', tweetIds)
      .order('created_at', { ascending: false });
      
    if (tweetsError) throw tweetsError;
    
    const processedTweets = processTweets(tweets || [], urlData);
    
    // Cache the results
    cacheTweets(url, processedTweets);
    
    return processedTweets;
  } catch (error) {
    console.error("[Tweet Finder] Error finding tweets:", error);
    return [];
  }
} 