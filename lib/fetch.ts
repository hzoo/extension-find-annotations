import { tweets } from "@/lib/signals";
import { debounce } from "@/lib/debounce";
import { error } from "@/lib/signals";
import { loading } from "@/lib/signals";
import { tweetsSourceUrl } from "@/lib/signals";
import { currentUrl } from "@/lib/messaging";
import { findTweetsForUrl } from "@/lib/supabase";

// Function to fetch tweets for a URL
export async function fetchTweetsImpl() {
    if (!currentUrl.value) return;
    
    // Don't set loading if we're already loading
    if (!loading.value) {
      loading.value = true;
    }
    
    // Clear error only if we have one
    if (error.value) {
      error.value = null;
    }
    
    try {
      const results = await findTweetsForUrl(currentUrl.value);
      
      // Only update tweets if they've actually changed
      if (JSON.stringify(tweets.value) !== JSON.stringify(results)) {
        tweets.value = results;
        tweetsSourceUrl.value = currentUrl.value; // Store the URL that these tweets are from
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tweets';
      if (error.value !== errorMessage) {
        error.value = errorMessage;
      }
    } finally {
      if (loading.value) {
        loading.value = false;
      }
    }
  }
  
  // Create a debounced version of fetchTweets
export  const fetchTweets = debounce(fetchTweetsImpl, 300);