import { memo } from "preact/compat";

const LoadingTweet = memo(() => (
	<div class="p-3 border-b border-gray-100 dark:border-gray-800">
		<div class="flex gap-2">
			<div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
			<div class="flex-1 space-y-2">
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/5" />
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
				<div class="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/5" />
			</div>
		</div>
	</div>
));

const LoadingTweetList = memo(() => (
	<div>
		<LoadingTweet />
		<LoadingTweet />
		<LoadingTweet />
	</div>
));

export { LoadingTweet, LoadingTweetList };
