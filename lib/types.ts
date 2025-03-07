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