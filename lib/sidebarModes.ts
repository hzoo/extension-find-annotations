import { signal } from "@preact/signals";

// Types
export type SidebarMode = 'overlay' | 'push';

// State
export const displayMode = signal<SidebarMode>('overlay');
export const isCollapsed = signal(false);

// Events
const DISPLAY_MODE_CHANGED_EVENT = 'sidebar-display-mode-changed';
const COLLAPSED_CHANGED_EVENT = 'sidebar-collapsed-changed';

// Load state from storage
export function loadSidebarState() {
  chrome.storage.sync.get(['sidebarCollapsed', 'sidebarDisplayMode'], (result) => {
    isCollapsed.value = result.sidebarCollapsed ?? false;
    displayMode.value = result.sidebarDisplayMode ?? 'overlay';
  });
}

// Save state to storage
export function saveSidebarState() {
  chrome.storage.sync.set({
    sidebarCollapsed: isCollapsed.value,
    sidebarDisplayMode: displayMode.value
  });
}

// Toggle display mode
export function toggleDisplayMode() {
  displayMode.value = displayMode.value === 'overlay' ? 'push' : 'overlay';
  saveSidebarState();
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent(DISPLAY_MODE_CHANGED_EVENT, { 
    detail: { mode: displayMode.value } 
  }));
}

// Toggle collapsed state
export function toggleCollapsed() {
  isCollapsed.value = !isCollapsed.value;
  saveSidebarState();
  
  // Dispatch event for push mode to adjust content
  window.dispatchEvent(new CustomEvent(COLLAPSED_CHANGED_EVENT, { 
    detail: { isCollapsed: isCollapsed.value } 
  }));
}

// Get CSS classes for sidebar based on display mode
export function getSidebarClasses(mode: SidebarMode): { 
  containerClasses: string; 
  contentClasses: string;
} {
  // Base classes for both modes
  const baseContentClasses = "h-screen w-[450px] border-l-2 border-solid border-l-gray-200 dark:border-l-gray-700 overflow-y-auto z-[9999] transition-all duration-300";
  
  if (mode === 'overlay') {
    return {
      containerClasses: "fixed top-0 right-0",
      contentClasses: `${baseContentClasses} bg-white/90 dark:bg-gray-900/90 backdrop-blur-md`
    };
  } else {
    return {
      containerClasses: "absolute top-0 right-0",
      contentClasses: `${baseContentClasses} bg-white dark:bg-gray-900`
    };
  }
}

// Get sidebar transform style based on collapsed state
export function getSidebarTransform(collapsed: boolean) {
  return {
    transform: collapsed ? 'translateX(100%)' : 'translateX(0)',
    transition: 'transform 300ms ease-in-out'
  };
}

// Event listener setup for content script
export function setupEventListeners(
  onDisplayModeChange: (mode: SidebarMode) => void,
  onCollapsedChange: (isCollapsed: boolean) => void
) {
  // Listen for display mode changes
  window.addEventListener(DISPLAY_MODE_CHANGED_EVENT, ((event: CustomEvent) => {
    const { mode } = event.detail;
    onDisplayModeChange(mode);
  }) as EventListener);
  
  // Listen for sidebar collapse/expand
  window.addEventListener(COLLAPSED_CHANGED_EVENT, ((event: CustomEvent) => {
    onCollapsedChange(event.detail.isCollapsed);
  }) as EventListener);
  
  return {
    cleanup: () => {
      window.removeEventListener(DISPLAY_MODE_CHANGED_EVENT, onDisplayModeChange as EventListener);
      window.removeEventListener(COLLAPSED_CHANGED_EVENT, onCollapsedChange as EventListener);
    }
  };
} 