import { useSignalEffect } from "@preact/signals";
import { useRef } from "preact/hooks";
import { currentUrl } from "@/lib/messaging";
import { LoadingTweetList } from "@/components/LoadingTweet";
import { ErrorMessage } from "@/components/ErrorMessage";
import { TweetList } from "@/components/TweetList";
import { SidebarHeader } from "@/components/SidebarHeader";
import { EmptyTweets } from "@/components/EmptyTweets";
import { tweets, loading, error, tweetsSourceUrl } from "@/lib/signals";
import { fetchTweets, fetchTweetsImpl } from "@/lib/fetch";
import { autoFetchEnabled } from "@/lib/settings";
import { TweetSourceNotification } from "@/components/TweetSourceNotification";
import CacheStatus from "@/components/CacheStatus";
import { getCachedTweets } from "@/lib/urlCache";

function SidebarBody() {
	// Load tweets when URL changes, with debounce
	useSignalEffect(() => {
		const newUrl = currentUrl.value;
		
		if (newUrl) {
			// First check if we have cached data
			const cachedData = getCachedTweets(newUrl);
			
			if (cachedData) {
				// If we have cached data, update source and tweets
				tweetsSourceUrl.value = newUrl;
				tweets.value = cachedData.tweets;
				error.value = null;
			} else if (autoFetchEnabled.value) {
				// Only fetch from Supabase if auto-fetch is enabled and we don't have cache
				tweetsSourceUrl.value = newUrl;
				fetchTweets();
			}
			// If no cache and auto-fetch disabled, user will see TweetSourceNotification
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
			<CacheStatus />
			{tweets.value.length === 0 && !loading.value && <EmptyTweets />}
			<SidebarBody />
		</div>
	);
}
