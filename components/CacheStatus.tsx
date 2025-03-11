import { useSignal, useComputed } from "@preact/signals";
import { loading } from "@/lib/signals";
import { currentUrl } from "@/lib/messaging";
import { formatCacheTime, getCachedTweets } from "@/lib/urlCache";
import { fetchTweetsImpl } from "@/lib/fetch";
import { useEffect } from "preact/hooks";

interface CacheStatusProps {
	className?: string;
}

export default function CacheStatus({ className = "" }: CacheStatusProps) {
	// Local signal to store the cache timestamp for the current URL
	const cacheTimestamp = useSignal<number | null>(null);
	const isLoading = useComputed(() => loading.value);
	const url = useComputed(() => currentUrl.value);

	// Update the cache timestamp whenever the URL changes
	useEffect(() => {
		// Function to update the cache timestamp
		const updateCacheTimestamp = () => {
			if (url.value) {
				const cached = getCachedTweets(url.value);
				cacheTimestamp.value = cached?.timestamp || null;
			} else {
				cacheTimestamp.value = null;
			}
		};

		// Initial update
		updateCacheTimestamp();

		// Also update when loading state changes
		const loadingChangeListener = () => {
			if (!loading.value) {
				// Update when loading finishes
				updateCacheTimestamp();
			}
		};

		// Subscribe to loading signal changes
		const unsubscribe = loading.subscribe(loadingChangeListener);

		// Clean up subscription
		return () => unsubscribe();
	}, [url.value]); // Only depend on url changes

	if (isLoading.value) {
		return (
			<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
				<div className={`text-xs text-gray-500 ${className}`}>
					<span className="inline-block w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-1" />
					Fetching tweets...
				</div>
			</div>
		);
	}

	if (!cacheTimestamp.value) {
		return null;
	}

	const timeString = formatCacheTime(cacheTimestamp.value);
	const now = Date.now();
	const ageMs = now - cacheTimestamp.value;

	// Format the age nicely
	let ageDisplay: string;
	if (ageMs < 60000) {
		// Less than a minute
		ageDisplay = "just now";
	} else if (ageMs < 3600000) {
		// Less than an hour
		const minutes = Math.floor(ageMs / 60000);
		ageDisplay = `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
	} else if (ageMs < 86400000) {
		// Less than a day
		const hours = Math.floor(ageMs / 3600000);
		ageDisplay = `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	} else if (ageMs < 2592000000) {
		// Less than a month
		const days = Math.floor(ageMs / 86400000);
		ageDisplay = `${days} ${days === 1 ? "day" : "days"} ago`;
	} else {
		const months = Math.floor(ageMs / 2592000000);
		ageDisplay = `${months} ${months === 1 ? "month" : "months"} ago`;
	}

	// Use different colors based on age
	let statusColor = "bg-green-500";
	if (ageMs > 86400000) {
		// More than a day
		statusColor = "bg-orange-500";
	} else if (ageMs > 3600000) {
		// More than an hour
		statusColor = "bg-yellow-500";
	}

	const handleRefresh = () => {
		fetchTweetsImpl(true);
	};

	return (
		<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
			<div className={`text-xs flex items-center ${className}`}>
				<span
					className={`inline-block w-2 h-2 ${statusColor} rounded-full mr-1`}
				/>
				<span className="text-gray-500" title={timeString}>
					Cache updated {ageDisplay}
				</span>

				<button
					className="ml-2 text-blue-500 hover:underline text-xs"
					onClick={handleRefresh}
					disabled={isLoading.value}
				>
					Refresh
				</button>
			</div>
		</div>
	);
}
