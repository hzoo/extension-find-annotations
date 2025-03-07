import { signal } from "@preact/signals";

// Settings signal
export const autoFetchEnabled = signal<boolean>(true); // Default to true for auto-fetch

// Type for our settings
interface ExtensionSettings {
  autoFetchEnabled: boolean;
}

// Load settings from storage
export async function loadSettings(): Promise<void> {
  try {
    const result = await browser.storage.sync.get({
      autoFetchEnabled: true, // Default value
    });
    
    autoFetchEnabled.value = result.autoFetchEnabled;
    console.log("Settings loaded:", { autoFetchEnabled: autoFetchEnabled.value });
  } catch (err) {
    console.error("Error loading settings:", err);
  }
}

// Save a specific setting
export async function saveSetting<K extends keyof ExtensionSettings>(
  key: K, 
  value: ExtensionSettings[K]
): Promise<void> {
  try {
    await browser.storage.sync.set({ [key]: value });
    console.log(`Setting saved: ${key}:`, value);
  } catch (err) {
    console.error(`Error saving setting ${key}:`, err);
  }
}

// Toggle auto fetch and save the setting
export async function toggleAutoFetch(): Promise<void> {
  autoFetchEnabled.value = !autoFetchEnabled.value;
  await saveSetting("autoFetchEnabled", autoFetchEnabled.value);
} 