import { useSignal, useComputed } from "@preact/signals";
import CacheStats from "@/components/CacheStats";
import { autoFetchEnabled, toggleAutoFetch, extractBaseDomain, isDomainWhitelisted, addDomainToWhitelist, removeDomainFromWhitelist } from "@/lib/settings";
import { useEffect } from "preact/hooks";

export function TwitterSettings() {
  const isApiInfoOpen = useSignal(false);
  const currentDomain = useSignal("");
  
  const handleAutoFetchToggle = async () => {
    await toggleAutoFetch();
  };
  
  const isWhitelisted = useComputed(() => 
    isDomainWhitelisted(currentDomain.value)
  );
  
  // Get current domain on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab.url) {
        currentDomain.value = extractBaseDomain(tab.url);
      }
    });
  }, []);
  
  const handleWhitelistToggle = async () => {
    if (isWhitelisted.value) {
      await removeDomainFromWhitelist(currentDomain.value);
    } else {
      await addDomainToWhitelist(currentDomain.value);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Privacy Settings */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Privacy Settings</h3>
        <div className="flex items-center justify-between">
          <label htmlFor="auto-fetch" className="text-sm text-gray-700 dark:text-gray-300">
            Auto-fetch tweets for every page
          </label>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id="auto-fetch"
              className="sr-only"
              checked={autoFetchEnabled.value}
              onChange={handleAutoFetchToggle}
            />
            <div className={`w-9 h-5 rounded-full transition ${
              autoFetchEnabled.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
              autoFetchEnabled.value ? 'after:translate-x-4' : ''
            }`} />
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {autoFetchEnabled.value
            ? "Tweets will be automatically fetched for whitelisted sites."
            : "For privacy, tweets will only be fetched when you click the refresh button."}
        </p>

        {/* Whitelist toggle for current site */}
        {autoFetchEnabled.value && currentDomain.value && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate" title={currentDomain.value}>
                  {currentDomain.value}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-3">
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={isWhitelisted.value}
                  onChange={handleWhitelistToggle}
                />
                <div className={`w-9 h-5 rounded-full transition ${
                  isWhitelisted.value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                  isWhitelisted.value ? 'after:translate-x-4' : ''
                }`} />
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isWhitelisted.value
                ? "Auto-fetch is enabled for this site"
                : "Auto-fetch is disabled for this site"}
            </p>
          </div>
        )}
      </div>

      {/* Twitter Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">About Twitter Archive</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Twitter content is fetched from a public archive. No API key is required.
        </p>

        <button
          onClick={() => isApiInfoOpen.value = !isApiInfoOpen.value}
          className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center"
        >
          <span>Technical details</span>
          <svg 
            className={`ml-1 w-4 h-4 transition-transform ${isApiInfoOpen.value ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isApiInfoOpen.value && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs text-gray-600 dark:text-gray-400">
            <p>This extension uses a read-only Supabase database to fetch archived tweets that link to the current page.</p>
            <p className="mt-1">No data is sent to Twitter or X, and no Twitter API key is required.</p>
          </div>
        )}
      </div>
      
      {/* Cache Stats */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Cache Statistics</h3>
        <CacheStats />
      </div>
    </div>
  );
} 