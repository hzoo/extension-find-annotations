import { currentUrl } from "@/lib/messaging";
import { tweetsSourceUrl } from "@/lib/signals";
import { fetchTweetsImpl } from "@/lib/fetch";
import { useSignal } from "@preact/signals";
import { useSignalEffect } from "@preact/signals";
import { getCachedTweets } from "@/lib/urlCache";
import { autoFetchEnabled } from "@/lib/settings";

export function TweetSourceNotification() {
  // Keep track of whether to show the notification
  const showNotification = useSignal(false);
  
  // Update the showNotification signal when relevant values change
  useSignalEffect(() => {
    const currentUrlValue = currentUrl.value;
    // Only show notification if:
    // 1. We have a current URL
    // 2. Auto-fetch is disabled
    // 3. There's no cached data for this URL
    // 4. The current tweets are from a different URL
    if (currentUrlValue && 
        !autoFetchEnabled.value && 
        !getCachedTweets(currentUrlValue) &&
        tweetsSourceUrl.value && 
        tweetsSourceUrl.value !== currentUrlValue) {
      showNotification.value = true;
    } else {
      showNotification.value = false;
    }
  });

  if (!showNotification.value) {
    return null;
  }

  // Only render if there's a mismatch between current URL and tweets source
  return (
    <div class="p-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 text-sm">
      <div class="flex items-center justify-between">
        <p class="text-amber-800 dark:text-amber-200">
          Tweets from different page
        </p>
        <button 
          onClick={() => fetchTweetsImpl()}
          class="px-2 py-1 text-xs bg-amber-200 hover:bg-amber-300 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded transition-colors"
        >
          Fetch for current page
        </button>
      </div>
    </div>
  );
} 