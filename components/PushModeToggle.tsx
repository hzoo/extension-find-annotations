import { displayMode, toggleDisplayMode } from "@/lib/pushMode";
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts";

export function PushModeToggle() {
  useKeyboardShortcuts([
    {
      combo: { key: "KeyM", altKey: true },
      callback: () => toggleDisplayMode()
    }
  ]);

  return (
    <button
      onClick={toggleDisplayMode}
      class="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors"
      title={`Switch to ${displayMode.value === 'overlay' ? 'push' : 'overlay'} mode (Alt+M)`}
      aria-label={`Switch to ${displayMode.value === 'overlay' ? 'push' : 'overlay'} mode (Alt+M)`}
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5" aria-hidden="true">
        {displayMode.value === 'overlay' ? (
          <path fill="currentColor" d="M3,3H21V5H3V3M9,7H21V9H9V7M3,11H21V13H3V11M9,15H21V17H9V15M3,19H21V21H3V19Z" />
        ) : (
          <path fill="currentColor" d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z" />
        )}
      </svg>
    </button>
  );
} 