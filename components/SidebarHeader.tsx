import { tweets } from "@/lib/signals";
import { SettingsToggle } from "@/components/SettingsToggle";

export function SidebarHeader() {
	const tweetCount = tweets.value.length;

	return (
		<div class="sticky top-0 z-10 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
			<div class="flex items-center justify-between mb-2">
				<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
					Related Tweets {tweetCount > 0 && `(${tweetCount})`}
				</h2>
				<SettingsToggle />
			</div>
		</div>
	);
}
