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

function SidebarBody() {
	// Keep track of if this is the first load
	const isFirstLoad = useRef(true);

	// Load tweets on first render and when URL changes, with debounce
	useSignalEffect(() => {
		if (currentUrl.value && autoFetchEnabled.value) {
			// Only fetch when auto-fetch is enabled
			// On first load, fetch immediately
			if (isFirstLoad.current) {
				isFirstLoad.current = false;
				fetchTweetsImpl(); // Use non-debounced version for initial load
			} else {
				// For subsequent URL changes, use debounced version
				fetchTweets();
			}
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
			{tweets.value.length === 0 && !loading.value && <EmptyTweets />}
			<SidebarBody />
		</div>
	);
}
