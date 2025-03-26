// lib/services/obsidian.tsx
import { h } from "preact";
import type { ContentItem, ServiceConfig } from "@/lib/types";
import { ServiceType } from "@/lib/types";
import type { ServiceProvider } from "@/lib/types";

export class ObsidianServiceProvider implements ServiceProvider {
  type = ServiceType.OBSIDIAN;
  name = "Obsidian Notes";
  #apiEndpoint = "http://localhost:27124"; // Default port for Obsidian Local REST API
  
  // Flag to track failed connection attempts
  #connectionFailed = false;
  #lastAttemptTime = 0;
  #retryTimeout = 30000; // 30 seconds between retry attempts
  
  constructor() {
    // Initialize from localStorage if available
    const savedEndpoint = localStorage.getItem('obsidian_api_endpoint');
    if (savedEndpoint) {
      this.#apiEndpoint = savedEndpoint;
    }
  }
  
  async findContentForUrl(url: string, forceRefresh = false): Promise<ContentItem[]> {
    try {
      // Check if API key is configured
      const apiKey = this.getApiKey();
      if (!apiKey) {
        console.log("[Obsidian Service] No API key configured, skipping search");
        return [];
      }

      // If we've had a connection failure recently, don't keep trying 
      const now = Date.now();
      if (this.#connectionFailed && (now - this.#lastAttemptTime < this.#retryTimeout)) {
        console.log("[Obsidian Service] Skipping request due to recent connection failure");
        return [];
      }
      
      this.#lastAttemptTime = now;
      
      // Extract keywords from URL to use for searching
      const keywords = this.extractKeywords(url);
      
      // Only try simple search, skip Dataview
      try {
        const results = await this.searchNotes(keywords);
        // Reset connection failed flag if search succeeds
        this.#connectionFailed = false;
        return results;
      } catch (error) {
        console.warn("[Obsidian Service] Search failed:", error);
        this.#connectionFailed = true;
        return [];
      }
    } catch (error) {
      console.error("[Obsidian Service] Error finding notes:", error);
      this.#connectionFailed = true;
      return [];
    }
  }
  
  private extractKeywords(url: string): string {
    // Remove protocol, www, etc.
    const cleanUrl = url.replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/$/, ''); // Remove trailing slash
    
    // Extract domain name and path elements as keywords
    const parts = cleanUrl.split(/[/\-_.]/).filter(Boolean);
    return parts.join(' ');
  }
  
  private async searchNotes(query: string): Promise<ContentItem[]> {
    try {
      // Get API key from localStorage using helper method
      const apiKey = this.getApiKey();
      const endpoint = this.getEndpoint();
      
      // Use simple search API
      const response = await fetch(`${endpoint}/search/simple?query=${encodeURIComponent(query)}&contextLength=100`, {
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const results = await response.json();
      
      // Convert Obsidian results to ContentItems
      return results.map((item: Record<string, unknown>) => this.convertObsidianResultToContentItem(item));
    } catch (error) {
      console.error("Failed to search Obsidian:", error);
      throw error;
    }
  }
  
  private convertObsidianResultToContentItem(result: Record<string, unknown>): ContentItem {
    // Safely access properties with type checks
    const path = typeof result.path === 'string' ? result.path : '';
    const file = result.file as Record<string, unknown> || {};
    const filePath = typeof file.path === 'string' ? file.path : '';
    const content = typeof result.content === 'string' ? result.content : '';
    const excerpt = typeof result.excerpt === 'string' ? result.excerpt : '';
    const ctime = typeof file.ctime === 'string' ? file.ctime : new Date().toISOString();
    const mtime = typeof file.mtime === 'string' ? file.mtime : new Date().toISOString();
    const score = typeof result.score === 'number' ? result.score : 0;
    const vault = typeof result.vault === 'string' ? result.vault : '';
    
    return {
      id: path || filePath || Math.random().toString(),
      text: content || excerpt || "No content available",
      created_at: ctime,
      creator_id: "obsidian-vault",
      creator_username: "Obsidian",
      updated_at: mtime,
      type: "note",
      service: ServiceType.OBSIDIAN,
      url: `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(path || filePath)}`,
      metadata: {
        original_note: result,
        score: score,
        path: path || filePath
      }
    };
  }
  
  renderItem(item: ContentItem): preact.JSX.Element {
    return h("div", { class: "p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700" }, [
      h("div", { class: "flex justify-between items-start" }, [
        h("a", { 
          href: item.url,
          class: "text-blue-600 dark:text-blue-400 font-medium hover:underline",
          target: "_blank"
        }, item.metadata?.path || "Obsidian Note"),
        h("span", { class: "text-xs text-gray-500" }, new Date(item.updated_at || item.created_at).toLocaleDateString())
      ]),
      h("p", { class: "mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-line" }, item.text)
    ]);
  }
  
  getDefaultConfig(): ServiceConfig {
    return {
      id: ServiceType.OBSIDIAN,
      name: "Obsidian Notes",
      description: "Display related notes from your Obsidian vault",
      enabled: true,
      apiEndpoint: this.#apiEndpoint
    };
  }
  
  // Helper methods to get and set API key and endpoint
  getApiKey(): string {
    return localStorage.getItem('obsidian_api_key') || '';
  }
  
  setApiKey(key: string): void {
    localStorage.setItem('obsidian_api_key', key);
  }
  
  getEndpoint(): string {
    return localStorage.getItem('obsidian_api_endpoint') || this.#apiEndpoint;
  }
  
  setEndpoint(endpoint: string): void {
    localStorage.setItem('obsidian_api_endpoint', endpoint);
    this.#apiEndpoint = endpoint;
  }
  
  // Update service configuration from settings
  updateConfig(config: ServiceConfig): void {
    if (config.apiKey) {
      this.setApiKey(config.apiKey);
    }
    
    if (config.apiEndpoint) {
      this.setEndpoint(config.apiEndpoint);
    }
  }
  
  // Add support for advanced Dataview DQL queries
  private async searchWithDataview(query: string): Promise<ContentItem[]> {
    try {
      // Get API key and endpoint from helper methods
      const apiKey = this.getApiKey();
      const endpoint = this.getEndpoint();
      
      const response = await fetch(`${endpoint}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/vnd.olrapi.dataview.dql+txt',
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Accept': 'application/json'
        },
        body: query
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const results = await response.json();
      
      // Convert Dataview results to ContentItems
      return this.convertDataviewResults(results);
    } catch (error) {
      console.error("Failed to search with Dataview:", error);
      throw error;
    }
  }
  
  private convertDataviewResults(results: unknown): ContentItem[] {
    // Dataview results come in different format than simple search
    // Handle the conversion appropriately
    if (!Array.isArray(results)) {
      return [];
    }
    
    return results.map(row => {
      // Dataview returns rows with named columns
      const item = row as Record<string, unknown>;
      
      // Use the first string column as content if available
      let content = '';
      let path = '';
      let title = '';
      
      // Find the path and content in the result
      for (const [key, value] of Object.entries(item)) {
        if (key.toLowerCase().includes('path') && typeof value === 'string') {
          path = value;
        }
        else if ((key.toLowerCase().includes('content') || key.toLowerCase().includes('text')) && typeof value === 'string') {
          content = value;
        }
        else if ((key.toLowerCase().includes('title') || key.toLowerCase().includes('name')) && typeof value === 'string') {
          title = value;
        }
      }
      
      return {
        id: path || Math.random().toString(),
        text: content || "View in Obsidian",
        created_at: new Date().toISOString(), // Dataview might not provide this
        creator_id: "obsidian-vault",
        creator_username: "Obsidian",
        updated_at: new Date().toISOString(),
        type: "note",
        service: ServiceType.OBSIDIAN,
        url: `obsidian://open?vault=${encodeURIComponent("")}&file=${encodeURIComponent(path)}`,
        metadata: {
          original_note: item,
          title: title || path.split('/').pop()?.replace(/\.md$/, '') || 'Untitled',
          path: path
        }
      };
    });
  }
  
  // Generate a Dataview query based on URL content
  private generateDataviewQuery(url: string): string {
    // Extract domain and path components
    let domain = "";
    let pathSegments: string[] = [];
    
    try {
      const parsedUrl = new URL(url);
      domain = parsedUrl.hostname;
      pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    } catch (e) {
      // Invalid URL, use raw string
      const parts = url.replace(/^https?:\/\//, '').split('/');
      domain = parts[0] || "";
      pathSegments = parts.slice(1).filter(Boolean);
    }
    
    // Generate a basic query to find notes with the domain or key path segments
    const keywords = [domain, ...pathSegments.slice(0, 2)].filter(Boolean);
    
    return `TABLE
  file.path AS "Note",
  file.mtime AS "Last Modified"
FROM #web OR #reference
WHERE ${keywords.map(kw => `contains(file.content, "${kw}")`).join(' OR ')}
SORT file.mtime DESC
LIMIT 10`;
  }
}