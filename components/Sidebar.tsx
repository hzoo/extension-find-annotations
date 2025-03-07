import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { findTweetsForUrl } from "@/lib/supabase";
import { Tweet as TweetComponent } from "@/components/Tweet";
import LoadingTweet from "@/components/LoadingTweet";
import type { Tweet } from "@/lib/types";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";
import { displayMode } from "@/lib/pushMode";
import { sidebarClasses as sc } from "@/lib/styles/sidebar";
import "./styles.css";
import { PushModeToggle } from "@/components/PushModeToggle";

const tweets = signal<Tweet[]>([]);
const loading = signal(false);
const error = signal<string | null>(null);
const isCollapsed = signal(false);

// Load collapsed state from storage
chrome.storage.sync.get(['sidebarCollapsed'], (result) => {
  isCollapsed.value = result.sidebarCollapsed ?? false;
});

// Save collapsed state
function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value;
  chrome.storage.sync.set({ sidebarCollapsed: isCollapsed.value });
}

export function Sidebar() {
  useEffect(() => {
    const fetchTweets = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const results = await findTweetsForUrl(window.location.href);
        tweets.value = results;
      } catch (err) {
        error.value = err instanceof Error ? err.message : 'Failed to fetch tweets';
      } finally {
        loading.value = false;
      }
    };

    fetchTweets();
  }, []);

  useKeyboardShortcuts([
    {
      combo: { key: "KeyT", altKey: true },
      callback: () => toggleCollapsed()
    }
  ]);

  if (!tweets.value.length && !loading.value) return null;

  return (
    <>
      <div 
        style={{
          transform: isCollapsed.value ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 300ms ease-in-out'
        }}
        class={`h-screen w-[450px] border-l-2 border-solid border-l-gray-200 dark:border-l-gray-700 overflow-y-auto transition-all duration-300 bg-white dark:bg-gray-900 ${sc.mode[displayMode.value]}`}
        data-display-mode={displayMode.value}
      >
        <div class="sticky top-0 z-10 p-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Related Tweets {tweets.value.length > 0 && `(${tweets.value.length})`}
            </h2>
            <div class="flex gap-2">
              <PushModeToggle />
              <button 
                onClick={toggleCollapsed} 
                class="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
                title={`${isCollapsed.value ? "Expand" : "Collapse"} sidebar (Alt+T)`}
                aria-label={`${isCollapsed.value ? "Expand" : "Collapse"} sidebar (Alt+T)`}
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5" aria-hidden="true">
                  <path 
                    fill="currentColor" 
                    d={isCollapsed.value 
                      ? "M8.59 16.59L13.17 12L8.59 7.41L10 6l6 6l-6 6l-1.41-1.41z"
                      : "M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6l6 6l1.41-1.41z"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div>
          {loading.value ? (
            <div>
              <LoadingTweet />
              <LoadingTweet />
              <LoadingTweet />
            </div>
          ) : error.value ? (
            <div class="p-4 text-red-500 dark:text-red-400 text-center">{error.value}</div>
          ) : (
            <div>
              {tweets.value.map(tweet => (
                <TweetComponent key={tweet.tweet_id} tweet={tweet} />
              ))}
            </div>
          )}
        </div>
      </div>

      {isCollapsed.value && tweets.value.length > 0 && (
        <button 
          class="fixed top-1/2 right-4 -translate-y-1/2 bg-blue-500 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg cursor-pointer hover:bg-blue-600 transition-colors z-[9999]"
          onClick={toggleCollapsed}
          aria-label="Show related tweets"
        >
          {tweets.value.length}
        </button>
      )}
    </>
  );
} 