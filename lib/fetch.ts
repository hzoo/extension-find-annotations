import { findTweetsForUrl } from "./supabase";
import { tweets, loading, error, tweetsSourceUrl } from "./signals";
import { currentUrl } from "./messaging";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeoutId: ReturnType<typeof setTimeout>;
  let resolveList: ((value: ReturnType<T>) => void)[] = [];

  const debounced = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      resolveList.push(resolve);

      timeoutId = setTimeout(() => {
        const result = func(...args);
        if (result instanceof Promise) {
          result.then((res) => resolveList.forEach((r) => r(res)));
        } else {
          resolveList.forEach((r) => r(result as ReturnType<T>));
        }
        resolveList = [];
      }, wait);
    });
  };

  debounced.cancel = () => {
    clearTimeout(timeoutId);
    resolveList = [];
  };

  return debounced;
}

// Base implementation to fetch tweets for a URL
export async function fetchTweetsImpl(forceRefresh = false) {
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
		const results = await findTweetsForUrl(currentUrl.value, forceRefresh);
		
		// Only update tweets if they've actually changed
		if (JSON.stringify(tweets.value) !== JSON.stringify(results)) {
			tweets.value = results;
			tweetsSourceUrl.value = currentUrl.value; // Store the URL that these tweets are from
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : "Failed to fetch tweets";
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
export const fetchTweets = debounce(fetchTweetsImpl, 300);
