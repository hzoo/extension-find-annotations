import { autoFetchEnabled, extractBaseDomain, isDomainWhitelisted } from "@/lib/settings";
import { ManualFetchButton } from "@/components/ManualFetchButton";
import { WhitelistButton } from "@/components/WhitelistButton";
import { useSignal, useComputed } from "@preact/signals";

export function EmptyList() {
  const currentDomain = useSignal("");

  // Get current domain on mount
  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab.url) {
      currentDomain.value = extractBaseDomain(tab.url);
    }
  });

  const isWhitelisted = useComputed(() => 
    isDomainWhitelisted(currentDomain.value)
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </div>
      
      {autoFetchEnabled.value ? (
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {isWhitelisted.value ? 
              "This page is quiet" :
              "Site needs whitelisting"
            }
          </h3>
          {isWhitelisted.value ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              No discussions or annotations have been found yet. Be the first to start the conversation!
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                To protect your privacy, we need permission to search for annotations.
              </p>
              <WhitelistButton />
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
                This will enable auto-fetch for all pages on {currentDomain.value}
              </p>
            </>
          )}
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Ready to explore
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Discover what others are saying about this page. Click below to check for annotations.
          </p>
          <ManualFetchButton />
        </>
      )}
    </div>
  );
} 