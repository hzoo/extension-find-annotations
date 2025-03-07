import { fetchTweetsImpl } from "@/lib/fetch";

export function ManualFetchButton() {
  const handleFetch = () => {
    fetchTweetsImpl();
  };

  return (
    <button
      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium transition-colors"
      onClick={handleFetch}
      aria-label="Fetch tweets for this page"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      Fetch Tweets
    </button>
  );
} 