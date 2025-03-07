import { signal } from "@preact/signals";

export interface TweetData {
	tweet_id: string;
	full_text: string;
	created_at: string;
	account_id: string;
}

export const tweets = signal<TweetData[]>([]);
export const loading = signal(false);
export const error = signal<string | null>(null);
