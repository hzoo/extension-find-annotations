import { useSignalEffect } from "@preact/signals";
import { useRef } from "preact/hooks";
import { currentUrl } from "@/lib/messaging";
import { LoadingTweetList } from "@/components/LoadingTweet";
import { ErrorMessage } from "@/components/ErrorMessage";
import { TweetList } from "@/components/TweetList";
import { SidebarHeader } from "@/components/SidebarHeader";
import { EmptyTweets } from "@/components/EmptyTweets";
import { tweets, loading, error } from "@/lib/signals";
import { fetchTweets, fetchTweetsImpl } from "@/lib/fetch";
import { autoFetchEnabled } from "@/lib/settings";
import { TweetSourceNotification } from "@/components/TweetSourceNotification";
import CacheStatus from "@/components/CacheStatus";
import { getCachedTweets } from "@/lib/urlCache";

function SidebarBody() {
	const lastUrl = useRef(currentUrl.value);

	// Load tweets when URL changes, with debounce
	useSignalEffect(() => {
		const newUrl = currentUrl.value;
		
		// Always update the lastUrl ref
		if (newUrl !== lastUrl.current) {
			lastUrl.current = newUrl;
			
			if (newUrl) {
				// First check if we have cached data
				const cachedData = getCachedTweets(newUrl);
				
				if (cachedData) {
					// If we have cached data, always load it regardless of autoFetchEnabled
					tweets.value = cachedData.tweets;
					error.value = null;
				} else if (autoFetchEnabled.value) {
					// Only fetch from Supabase if auto-fetch is enabled and we don't have cache
					fetchTweets();
				}
				// If no cache and auto-fetch disabled, user will see TweetSourceNotification
			}
		}
	});

	return (
		<div className="flex-1 overflow-y-auto">
			{loading.value ? (
				<LoadingTweetList />
			) : error.value ? (
				<ErrorMessage message={error.value} />
			) : (
				<TweetList tweets={tweets.value} />
			)}
		</div>
	);
}

export function Sidebar() {
	// Simplified structure without unnecessary background colors
	return (
		<div className="flex flex-col h-full">
			<SidebarHeader />
			<TweetSourceNotification />
			<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
				<CacheStatus />
			</div>
			{tweets.value.length === 0 && !loading.value && <EmptyTweets />}
			<SidebarBody />
		</div>
	);
}
