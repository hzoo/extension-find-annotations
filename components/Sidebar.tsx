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

function SidebarBody() {
	// Keep track of if this is the first load
	const isFirstLoad = useRef(true);
	const lastUrl = useRef(currentUrl.value);

	// Load tweets on first render and when URL changes, with debounce
	useSignalEffect(() => {
		const newUrl = currentUrl.value;
		
		// Always update the lastUrl ref
		if (newUrl !== lastUrl.current) {
			lastUrl.current = newUrl;
			
			// If auto-fetch is enabled, fetch the tweets
			if (newUrl && autoFetchEnabled.value) {
				// On first load, fetch immediately
				if (isFirstLoad.current) {
					isFirstLoad.current = false;
					fetchTweetsImpl(); // Use non-debounced version for initial load
				} else {
					// For subsequent URL changes, use debounced version
					fetchTweets();
				}
			}
			// If auto-fetch is disabled, we don't fetch automatically
			// The user will see the TweetSourceNotification to fetch manually
		}
	});

	return (
		<div class="flex-1 overflow-y-auto">
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
		<div class="flex flex-col h-full">
			<SidebarHeader />
			<TweetSourceNotification />
			{tweets.value.length === 0 && !loading.value && <EmptyTweets />}
			<SidebarBody />
		</div>
	);
}
