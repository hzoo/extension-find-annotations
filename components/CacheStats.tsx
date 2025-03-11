import { useEffect } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { getCacheStats, clearAllCachedTweets } from "@/lib/urlCache";

interface CacheStatsProps {
  className?: string;
}

export default function CacheStats({ className = "" }: CacheStatsProps) {
  const memoryEntries = useSignal(0);
  const storageEntries = useSignal(0);
  
  // Function to update stats
  function updateStats() {
    const stats = getCacheStats();
    memoryEntries.value = stats.memoryEntries;
    storageEntries.value = stats.storageEntries;
  }
  
  // Load stats on mount
  useEffect(() => {
    updateStats();
  }, []);
  
  return (
    <div className={`text-sm ${className}`}>
      <h3 className="font-medium mb-2">Cache Statistics</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">In Memory</div>
          <div className="font-medium">{memoryEntries.value} URLs</div>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
          <div className="text-xs text-gray-500 dark:text-gray-400">In Storage</div>
          <div className="font-medium">{storageEntries.value} URLs</div>
        </div>
      </div>
      <div className="flex space-x-2">
        <button 
          className="px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-800 dark:text-blue-200 rounded"
          onClick={updateStats}
        >
          Refresh Stats
        </button>
        <button 
          className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-800 dark:text-red-200 rounded"
          onClick={() => {
            if (confirm("Clear all cached tweets? This cannot be undone.")) {
              clearAllCachedTweets();
              updateStats();
            }
          }}
        >
          Clear Cache
        </button>
      </div>
    </div>
  );
} 