import { useSignal } from "@preact/signals";
import { autoFetchEnabled, toggleAutoFetch } from "@/lib/settings";
import { useEffect, useRef } from "preact/hooks";

export function SettingsToggle() {
  const isOpen = useSignal(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleDropdown = () => {
    isOpen.value = !isOpen.value;
  };

  const handleAutoFetchToggle = async () => {
    await toggleAutoFetch();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        isOpen.value = false;
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings cog icon */}
      <button
        className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
        onClick={toggleDropdown}
        aria-label="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings dropdown */}
      {isOpen.value && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Privacy Settings</h3>
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
                ? "Tweets will be automatically fetched when you visit a page."
                : "For privacy, tweets will only be fetched when you click the refresh button."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}