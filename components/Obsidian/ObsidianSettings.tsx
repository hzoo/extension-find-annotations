import { useEffect, useCallback } from "preact/hooks";
import { useSignal } from "@preact/signals";
import { serviceRegistry, updateServiceConfig } from "@/lib/services";
import { ServiceType } from "@/lib/types";
import type { ObsidianServiceProvider } from "@/lib/services/obsidian";
import { extractBaseDomain } from "@/lib/settings";

export function ObsidianSettings() {
  // Get the Obsidian service with proper type casting
  const obsidianService = serviceRegistry.getService(ServiceType.OBSIDIAN) as ObsidianServiceProvider | undefined;
  
  // Create signals for the form values
  const apiKey = useSignal(obsidianService?.getApiKey() || '');
  const endpoint = useSignal(obsidianService?.getEndpoint() || 'https://localhost:27124');
  const isSaved = useSignal(false);
  const currentDomain = useSignal("");
  
  
  // Get current domain on mount
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab.url) {
        currentDomain.value = extractBaseDomain(tab.url);
      }
    });
  }, [currentDomain]);
  
  // Save settings to localStorage
  const saveSettings = () => {
    if (obsidianService) {
      // Update service config
      const config = {
        id: ServiceType.OBSIDIAN,
        name: "Obsidian Notes",
        description: "Display related notes from your Obsidian vault",
        enabled: true,
        apiKey: apiKey.value,
        apiEndpoint: endpoint.value
      }
      updateServiceConfig(config);
      obsidianService.updateConfig(config);
      
      // Show saved message
      isSaved.value = true;
      setTimeout(() => {
        isSaved.value = false;
      }, 2000);
    }
  };
  
  // Reset form to saved values - defined with useCallback to use in useEffect
  const resetForm = useCallback(() => {
    if (obsidianService) {
      apiKey.value = obsidianService.getApiKey();
      endpoint.value = obsidianService.getEndpoint();
    }
  }, [obsidianService, apiKey, endpoint]);
  
  // Reset form when service changes
  useEffect(() => {
    resetForm();
  }, [resetForm]);
  
  if (!obsidianService) {
    return <p className="text-red-500 p-4">Obsidian service not available</p>;
  }
  
  return (
    <div className="space-y-4">
      {/* Obsidian API Settings */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Obsidian API Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="obsidianApiKey">
              API Key
            </label>
            <input
              id="obsidianApiKey"
              type="password"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
              value={apiKey.value}
              onInput={(e) => apiKey.value = (e.target as HTMLInputElement).value}
              placeholder="Enter your Obsidian Local REST API key"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the key you configured in the Obsidian Local REST API plugin settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="obsidianEndpoint">
              API Endpoint
            </label>
            <input
              id="obsidianEndpoint"
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
              value={endpoint.value}
              onInput={(e) => endpoint.value = (e.target as HTMLInputElement).value}
              placeholder="http://localhost:27123"
            />
            <p className="text-xs text-gray-500 mt-1">
              The URL of your Obsidian REST API (including port)
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={saveSettings}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save API Settings
            </button>
            
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Reset
            </button>
          </div>
          
          {isSaved.value && (
            <p className="text-green-500 text-sm">Settings saved successfully!</p>
          )}
        </div>
      </div>
      
      {/* Setup Instructions */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Setup Instructions</h3>
        <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-md dark:bg-yellow-900/20 dark:border-yellow-800">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">How to set up</h4>
          <ol className="ml-4 mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-decimal">
            <li>Install the "Local REST API" plugin in Obsidian</li>
            <li>Configure an API key in the plugin settings</li>
            <li>Enter the same API key here</li>
            <li>Ensure your Obsidian vault is open when using this extension</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 