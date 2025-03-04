import { recentTweets } from "@/lib/tweet-extractor";
import { getAllTweets } from "@/lib/storage";
import { useEffect } from "react";
import type { TweetData } from "@/lib/tweet-extractor";
import { useSignal } from "@preact/signals";

function getTimeSince(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	return `${Math.floor(hours / 24)}d`;
}

export function DebugView() {
	const storedTweets = useSignal<TweetData[]>([]);
	useEffect(() => {
		storedTweets.value = getAllTweets();
	}, [storedTweets]);

	return (
		<div className="fixed bottom-4 right-4 p-2 bg-white/90 border border-gray-200 rounded-lg shadow-lg max-w-[400px] text-xs">
			<details>
				<summary className="cursor-pointer text-gray-500 flex items-center gap-2">
					<span className="font-medium">Debug</span>
					<span className="text-gray-400">({recentTweets.value.length})</span>
				</summary>
				
				<div className="mt-2 space-y-1 max-h-[300px] overflow-auto">
					{recentTweets.value.slice(-5).reverse().map((tweet) => (
						<div key={tweet.id} className="hover:bg-gray-50 p-1.5 rounded border border-gray-100">
							<div className="flex justify-between gap-2 text-gray-400">
								<span>@{tweet.username}</span>
								<span>{getTimeSince(tweet.timeViewed)}</span>
							</div>
							<div className="text-gray-600 truncate">{tweet.text}</div>
							<div className="text-gray-400 text-[10px]">ID: {tweet.id}</div>
						</div>
					))}
				</div>

				<details className="mt-2">
					<summary className="cursor-pointer text-gray-400">Raw JSON</summary>
					<pre className="mt-1 bg-gray-50 p-1 rounded overflow-auto text-[10px] max-h-32">
						{JSON.stringify(recentTweets.value, null, 2)}
					</pre>
				</details>
			</details>
		</div>
	);
}
