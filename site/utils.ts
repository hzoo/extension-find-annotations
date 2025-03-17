import { supabase } from "@/lib/supabase";
import type { TweetData, TweetUrl } from "@/lib/signals";
import { processTweets } from "@/lib/signals";
import { isAnyTwitterUrl } from "@/lib/urlCache";

// Extend TweetData type to include tweet_urls from the Supabase query result
interface TweetDataWithUrls extends TweetData {
    tweet_urls: Array<{
        url: string;
        expanded_url: string;
    }>;
}

export async function fetchLatestLinks() {
    try {
        // Get tweets with URLs, include only necessary fields
        const { data: tweetData, error: tweetsError } = await supabase
            .from('tweets')
            .select(`
                tweet_id,
                full_text,
                created_at,
                account_id,
                reply_to_tweet_id,
                reply_to_user_id,
                reply_to_username,
                updated_at,
                tweet_urls(url, expanded_url)
            `)
            // Join condition to only get tweets that have URLs
            .not('tweet_urls', 'is', null)
            .order('created_at', { ascending: false })
            .limit(500); // Get more to ensure we have enough after filtering

        if (tweetsError) throw tweetsError;
        if (!tweetData?.length) {
            return { tweets: [], error: null };
        }

        // Pre-define Twitter domains for faster matching
        const twitterDomains = ['twitter.com', 'x.com', 't.co'];
        const isTwitterUrl = (url: string) => 
            twitterDomains.some(domain => url.includes(domain));

        // Filter and deduplicate in a single pass for better performance
        const accountMap = new Map<string, TweetDataWithUrls>();
        
        for (const tweet of tweetData as TweetDataWithUrls[]) {
            // Skip if we already have a newer tweet for this account
            if (accountMap.has(tweet.account_id)) continue;
            
            // Check if this tweet has at least one non-Twitter URL
            const hasExternalLink = tweet.tweet_urls.some(
                (u: { expanded_url: string }) => !isTwitterUrl(u.expanded_url)
            );
            
            if (hasExternalLink) {
                accountMap.set(tweet.account_id, tweet);
            }
        }
        
        if (accountMap.size === 0) {
            return { tweets: [], error: null };
        }

        const uniqueTweets = Array.from(accountMap.values());

        // Map tweets to their best non-Twitter URL
        const tweetUrlPairs: TweetUrl[] = uniqueTweets.map(tweet => {
            const urls = tweet.tweet_urls;
            const nonTwitterUrl = urls.find(
                (u: { expanded_url: string }) => !isTwitterUrl(u.expanded_url)
            );
            
            // Use first non-Twitter URL or first URL if all are Twitter
            const bestUrl = nonTwitterUrl || urls[0];
            
            return {
                tweet_id: tweet.tweet_id,
                url: bestUrl.url,
                expanded_url: bestUrl.expanded_url
            };
        });

        // Process tweets once with all URL data ready
        const processedTweets = processTweets(uniqueTweets, tweetUrlPairs);

        return { tweets: processedTweets, error: null };
    } catch (err) {
        return { 
            tweets: [], 
            error: err instanceof Error ? err.message : "Failed to fetch tweets" 
        };
    }
} 