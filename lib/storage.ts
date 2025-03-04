import type { TweetData } from '@/lib/tweet-extractor';

const TWEET_KEY_PREFIX = 'tweet:';
const TWEET_IDS_KEY = 'tweet-ids';

export function getTweetKey(id: string): string {
  return `${TWEET_KEY_PREFIX}${id}`;
}

export function storeTweet(tweet: TweetData): void {
  try {
    // Get existing tweet if it exists
    const existingTweet = getTweet(tweet.id);
    
    // Merge with existing tweet if it exists, otherwise use new tweet
    const mergedTweet = existingTweet 
      ? { ...existingTweet, ...tweet, metrics: { ...existingTweet.metrics, ...tweet.metrics } }
      : tweet;

    // Store the merged tweet data
    localStorage.setItem(getTweetKey(tweet.id), JSON.stringify(mergedTweet));

    // Update the list of tweet IDs (only if it's a new tweet)
    if (!existingTweet) {
      const ids = new Set(JSON.parse(localStorage.getItem(TWEET_IDS_KEY) || '[]'));
      ids.add(tweet.id);
      localStorage.setItem(TWEET_IDS_KEY, JSON.stringify([...ids]));
    }
  } catch (error) {
    console.error('Error storing tweet:', error);
  }
}

export function hasTweet(id: string): boolean {
  return localStorage.getItem(getTweetKey(id)) !== null;
}

export function getTweet(id: string): TweetData | null {
  try {
    const data = localStorage.getItem(getTweetKey(id));
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error retrieving tweet:', error);
    return null;
  }
}

export function getAllTweetIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(TWEET_IDS_KEY) || '[]');
  } catch (error) {
    console.error('Error retrieving tweet IDs:', error);
    return [];
  }
}

export function getAllTweets(): TweetData[] {
  try {
    return getAllTweetIds()
      .map(id => getTweet(id))
      .filter((tweet): tweet is TweetData => tweet !== null);
  } catch (error) {
    console.error('Error retrieving all tweets:', error);
    return [];
  }
}

// Optional: Clean up old tweets if storage is getting full
export function cleanupOldTweets(maxTweets = 1000): void {
  try {
    const ids = getAllTweetIds();
    if (ids.length <= maxTweets) return;

    // Remove oldest tweets
    const toRemove = ids.slice(0, ids.length - maxTweets);
    toRemove.forEach(id => {
      localStorage.removeItem(getTweetKey(id));
    });

    // Update IDs list
    const remainingIds = ids.slice(ids.length - maxTweets);
    localStorage.setItem(TWEET_IDS_KEY, JSON.stringify(remainingIds));
  } catch (error) {
    console.error('Error cleaning up tweets:', error);
  }
} 