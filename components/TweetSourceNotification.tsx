import { currentUrl } from "@/lib/messaging";
import { tweetsSourceUrl } from "@/lib/signals";
import { fetchTweetsImpl } from "@/lib/fetch";
import { useSignal } from "@preact/signals";
import { useSignalEffect } from "@preact/signals";

export function TweetSourceNotification() {
  // Keep track of whether to show the notification
  const showNotification = useSignal(false);
  
  // Update the showNotification signal when relevant values change
  useSignalEffect(() => {
    if (tweetsSourceUrl.value && currentUrl.value && 
        tweetsSourceUrl.value !== currentUrl.value) {
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