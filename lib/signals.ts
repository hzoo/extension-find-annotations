import { signal } from "@preact/signals";
import { setExpandedUrls, isTwitterStatusUrl } from "./urlCache";

export interface TweetUrl {
	tweet_id: string;
	url: string;
	expanded_url: string;
}

export enum TweetType {
	STANDALONE = "standalone",
	REPLY = "reply",
	SELF_REPLY = "self_reply",
	RETWEET = "retweet",
	QUOTE_RETWEET = "quote_retweet"
}

// https://open-birdsite-db.vercel.app/api/reference#tag/tweets
export interface TweetData {
	tweet_id: string;
	full_text: string;
	created_at: string;
	account_id: string;
	// archive_upload_id: number;
	// fts: string;
	reply_to_tweet_id: string | null;
	reply_to_user_id: string | null;
	reply_to_username: string | null;
	// retweet_count: number;
	updated_at: string;
	// favorite_count: number;
	type?: TweetType; // added by processTweets
}

export const tweets = signal<TweetData[]>([]);
export const loading = signal(false);
export const error = signal<string | null>(null);
export const tweetsSourceUrl = signal<string>("");

/**
 * Determines the type of a tweet based on its properties
 */
export function determineTweetType(tweet: TweetData): TweetType {
	// Reply to someone else's tweet
	if (tweet.reply_to_tweet_id && tweet.reply_to_user_id !== tweet.account_id) {
		return TweetType.REPLY;
	}
	
	// Self-reply (reply to own tweet)
	if (tweet.reply_to_tweet_id && tweet.reply_to_user_id === tweet.account_id) {
		return TweetType.SELF_REPLY;
	}
	
	// For retweets and quote tweets, we would need additional fields from the Twitter API
	// This is a simplified implementation - you may need to adjust based on your data structure
	if (tweet.full_text.startsWith("RT @")) {
		return TweetType.RETWEET;
	}
	
	// Default case: standalone tweet
	return TweetType.STANDALONE;
}

/**
 * Processes tweets to add type information
 * @param tweetData The raw tweet data
 * @param tweetUrls Optional URL data from the tweet_urls table
 */
export function processTweets(tweetData: TweetData[], tweetUrls?: TweetUrl[]): TweetData[] {
	const urlsByTweetId = new Map<string, TweetUrl[]>();
	
	// Update URL cache if we have new URL data
	if (tweetUrls?.length) {
		setExpandedUrls(tweetUrls);
		
		// Group URLs by tweet_id for efficient lookup
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
		
		// If we have URLs and it's not already classified as something else,
		// check if any of the URLs are to twitter.com/*/status/* which would indicate a quote tweet
		if (type === TweetType.STANDALONE && urls.some(url => isTwitterStatusUrl(url.expanded_url))) {
			return { ...tweet, full_text: processedText, type: TweetType.QUOTE_RETWEET };
		}
		
		return { ...tweet, full_text: processedText, type };
	});
}
