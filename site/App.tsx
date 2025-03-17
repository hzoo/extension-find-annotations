import { useSignal, useSignalEffect } from "@preact/signals";
import { TweetList } from "@/components/TweetList";
import type { TweetData } from "@/lib/signals";
import { fetchLatestLinks } from "./utils";

export function App() {
    const tweets = useSignal<TweetData[]>([]);
    const loading = useSignal(true);
    const error = useSignal<string | null>(null);

    useSignalEffect(() => {
        async function loadTweets() {
            const { tweets: latestTweets, error: fetchError } = await fetchLatestLinks();
            tweets.value = latestTweets;
            error.value = fetchError;
            loading.value = false;
        }

        loadTweets();
    });

    return (
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header class="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
                <div class="max-w-4xl mx-auto px-4 py-6">
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Community Archive Links
                    </h1>
                    <p class="mt-2 text-gray-600 dark:text-gray-400">
                        Latest links shared in the community
                    </p>
                </div>
            </header>

            <main class="max-w-3xl mx-auto px-4 py-8">
                {loading.value ? (
                    <div class="flex items-center justify-center py-12">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100" />
                    </div>
                ) : error.value ? (
                    <div class="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                        <p class="text-red-800 dark:text-red-200">{error.value}</p>
                    </div>
                ) : tweets.value.length === 0 ? (
                    <div class="text-center py-12">
                        <p class="text-gray-600 dark:text-gray-400">No links found</p>
                    </div>
                ) : (
                    <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                        <TweetList tweets={tweets.value} />
                    </div>
                )}
            </main>
        </div>
    );
}