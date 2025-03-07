import { signal } from "@preact/signals";

export type DisplayMode = 'overlay' | 'push';
export const displayMode = signal<DisplayMode>('overlay');

// Events
const DISPLAY_MODE_CHANGED = 'sidebar-display-mode-changed';
const COLLAPSED_CHANGED = 'sidebar-collapsed-changed';

export function toggleDisplayMode() {
  const newMode = displayMode.value === 'overlay' ? 'push' : 'overlay';
  displayMode.value = newMode;
  chrome.storage.sync.set({ sidebarDisplayMode: newMode });
  
  window.dispatchEvent(new CustomEvent(DISPLAY_MODE_CHANGED, { 
    detail: { mode: newMode } 
  }));
}

export function notifyCollapsedChange(isCollapsed: boolean) {
  window.dispatchEvent(new CustomEvent(COLLAPSED_CHANGED, { 
    detail: { isCollapsed } 
  }));
}

// Load initial state
chrome.storage.sync.get(['sidebarDisplayMode'], (result) => {
  displayMode.value = result.sidebarDisplayMode ?? 'overlay';
});

// Content script functions
export function setupPushMode() {
  let originalBodyStyles = '';
  let contentWrapper: HTMLElement | null = null;
  
  function getOrCreateContentWrapper() {
    if (!contentWrapper) {
      originalBodyStyles = document.body.style.cssText;
      
      contentWrapper = document.createElement('div');
      contentWrapper.id = 'ext-content-wrapper';
      contentWrapper.style.cssText = 'flex: 1; min-width: 0; position: relative;';
      
      while (document.body.firstChild) {
        contentWrapper.appendChild(document.body.firstChild);
      }
      
      document.body.appendChild(contentWrapper);
      document.body.style.cssText = 'margin: 0; padding: 0; display: flex; flex-direction: row; width: 100%; min-height: 100vh; overflow-x: hidden;';
    }
    
    return contentWrapper;
  }
  
  function applyPushMode(isActive: boolean, isSidebarCollapsed: boolean) {
    if (isActive) {
      getOrCreateContentWrapper();
    }
  }
  
  function cleanupPushMode() {
    if (contentWrapper) {
      while (contentWrapper.firstChild) {
        document.body.insertBefore(contentWrapper.firstChild, contentWrapper);
      }
      
      contentWrapper.remove();
      contentWrapper = null;
      document.body.style.cssText = originalBodyStyles;
    }
  }
  
  // Event listeners
  window.addEventListener(DISPLAY_MODE_CHANGED, ((event: CustomEvent) => {
    const { mode } = event.detail;
    displayMode.value = mode;
    
    if (mode === 'push') {
      chrome.storage.sync.get(['sidebarCollapsed'], (result) => {
        const isCollapsed = result.sidebarCollapsed ?? false;
        applyPushMode(true, isCollapsed);
      });
    } else {
      applyPushMode(false, false);
    }
  }) as EventListener);
  
  window.addEventListener(COLLAPSED_CHANGED, ((event: CustomEvent) => {
    if (displayMode.value === 'push') {
      applyPushMode(true, event.detail.isCollapsed);
    }
  }) as EventListener);
  
  // Initialize
  chrome.storage.sync.get(['sidebarDisplayMode', 'sidebarCollapsed'], (result) => {
    displayMode.value = result.sidebarDisplayMode ?? 'overlay';
    const isCollapsed = result.sidebarCollapsed ?? false;
    
    if (displayMode.value === 'push') {
      applyPushMode(true, isCollapsed);
    }
  });
  
  return { cleanup: cleanupPushMode };
} 