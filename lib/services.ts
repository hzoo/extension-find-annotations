import { signal } from "@preact/signals";
import { ServiceType } from "@/lib/types";
import type { ServiceProvider, ContentItem, ServiceConfig } from "@/lib/types";

// Global signals
export const contentItems = signal<ContentItem[]>([]);
export const loading = signal(false);
export const error = signal<string | null>(null);
export const contentSourceUrl = signal<string>("");
export const activeService = signal<ServiceType>(ServiceType.TWITTER);
export const availableServices = signal<ServiceConfig[]>([]);

// Registry to hold all service implementations
class ServiceRegistry {
  private services = new Map<ServiceType, ServiceProvider>();

  register(service: ServiceProvider): void {
    this.services.set(service.type, service);
    
    // Update available services signal
    const currentServices = availableServices.value;
    const existingIndex = currentServices.findIndex(s => s.id === service.type);
    
    if (existingIndex >= 0) {
      // Update existing service
      currentServices[existingIndex] = {
        ...currentServices[existingIndex],
        name: service.name
      };
      availableServices.value = [...currentServices];
    } else {
      // Add new service
      const config = service.getDefaultConfig();
      availableServices.value = [...currentServices, config];
    }
  }

  getService(type: ServiceType): ServiceProvider | undefined {
    return this.services.get(type);
  }

  getAllServices(): ServiceProvider[] {
    return Array.from(this.services.values());
  }
  
  getEnabledServices(): ServiceProvider[] {
    return this.getAllServices().filter(service => {
      const config = availableServices.value.find(s => s.id === service.type);
      return config?.enabled;
    });
  }
}

// Create and export the singleton instance
export const serviceRegistry = new ServiceRegistry();

// Function to find content for the current URL using the active service
export async function fetchContentImpl(forceRefresh = false) {
  if (!contentSourceUrl.value) return;
  
  // Skip if already loading (prevents multiple simultaneous requests)
  if (loading.value) {
    console.log("Skipping fetch - already in progress");
    return;
  }
  
  loading.value = true;
  
  // Clear error only if we have one
  if (error.value) {
    error.value = null;
  }
  
  try {
    const service = serviceRegistry.getService(activeService.value);
    
    if (!service) {
      throw new Error(`Service ${activeService.value} not available`);
    }
    
    const results = await service.findContentForUrl(contentSourceUrl.value, forceRefresh);
    
    // Only update content if it actually changed
    if (JSON.stringify(contentItems.value) !== JSON.stringify(results)) {
      contentItems.value = results;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to fetch content";
    if (error.value !== errorMessage) {
      error.value = errorMessage;
    }
  } finally {
    if (loading.value) {
      loading.value = false;
    }
  }
}

// Helper function to change the active service
export function setActiveService(serviceType: ServiceType): void {
  if (activeService.value !== serviceType) {
    activeService.value = serviceType;
    // Refetch content with the new service
    fetchContentImpl(false);
  }
}

// Helper to update service config
export function updateServiceConfig(config: ServiceConfig): void {
  const services = availableServices.value;
  const index = services.findIndex(s => s.id === config.id);
  
  if (index >= 0) {
    services[index] = config;
    availableServices.value = [...services];
  }
} 