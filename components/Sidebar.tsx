import { useRef } from "preact/hooks";
import { useSignalEffect } from "@preact/signals";
import { currentUrl } from "@/lib/messaging";
import { LoadingTweetList } from "@/components/LoadingTweet";
import ErrorMessage from "@/components/ErrorMessage";
import TweetList from "@/components/TweetList";
import {SidebarHeader} from "@/components/SidebarHeader";
import EmptyTweets from "@/components/EmptyTweets";
import {tweets, loading, error} from "@/lib/signals";
import { fetchTweetsImpl } from "@/lib/fetch";
import { fetchTweets } from "@/lib/fetch";

export function Sidebar() {
  // Keep track of if this is the first load
  const isFirstLoad = useRef(true);

  // Load tweets on first render and when URL changes, with debounce
  useSignalEffect(() => {
    if (currentUrl.value) {
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

  if (!tweets.value.length && !loading.value) {
    return <EmptyTweets />;
  }

  // Simplified structure without unnecessary background colors
  return (
    <div class="flex flex-col h-full">
      <SidebarHeader />

      <div class="flex-1 overflow-y-auto">
        {loading.value ? <LoadingTweetList /> :
         error.value ? <ErrorMessage message={error.value} /> : 
         <TweetList tweets={tweets.value} />
        }
      </div>
    </div>
  );
} 