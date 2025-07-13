// Location: src/lib/cache.ts
// Description: Advanced caching system for RepoDock.dev - provides in-memory and localStorage caching with TTL, invalidation, and optimistic updates

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheOptions {
  ttl?: number; // Default TTL in milliseconds
  storage?: 'memory' | 'localStorage' | 'both';
  prefix?: string;
}

class CacheManager {
  private memoryCache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private prefix = 'repodock_cache_';

  constructor(private options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.prefix = options.prefix || this.prefix;
    
    // Clean up expired items periodically
    setInterval(() => this.cleanup(), 60 * 1000); // Every minute
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private isExpired(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private cleanup(): void {
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage cache
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || '');
            if (this.isExpired(item)) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    const cacheKey = this.getKey(key);
    const storage = this.options.storage || 'both';

    // Store in memory
    if (storage === 'memory' || storage === 'both') {
      this.memoryCache.set(cacheKey, item);
    }

    // Store in localStorage
    if ((storage === 'localStorage' || storage === 'both') && typeof window !== 'undefined') {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(item));
      } catch (error) {
        console.warn('Failed to store in localStorage:', error);
      }
    }
  }

  get<T>(key: string): T | null {
    const cacheKey = this.getKey(key);
    const storage = this.options.storage || 'both';

    // Try memory cache first
    if (storage === 'memory' || storage === 'both') {
      const memoryItem = this.memoryCache.get(cacheKey);
      if (memoryItem && !this.isExpired(memoryItem)) {
        return memoryItem.data;
      }
      if (memoryItem && this.isExpired(memoryItem)) {
        this.memoryCache.delete(cacheKey);
      }
    }

    // Try localStorage
    if ((storage === 'localStorage' || storage === 'both') && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const item: CacheItem<T> = JSON.parse(stored);
          if (!this.isExpired(item)) {
            // Restore to memory cache if using both
            if (storage === 'both') {
              this.memoryCache.set(cacheKey, item);
            }
            return item.data;
          } else {
            localStorage.removeItem(cacheKey);
          }
        }
      } catch (error) {
        console.warn('Failed to read from localStorage:', error);
      }
    }

    return null;
  }

  invalidate(key: string): void {
    const cacheKey = this.getKey(key);
    
    // Remove from memory
    this.memoryCache.delete(cacheKey);
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(cacheKey);
    }
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (regex.test(key)) {
        this.memoryCache.delete(key);
      }
    }
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && regex.test(key)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear localStorage items with our prefix
    if (typeof window !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }

  // Get cache statistics
  getStats() {
    return {
      memorySize: this.memoryCache.size,
      localStorageSize: typeof window !== 'undefined' 
        ? Object.keys(localStorage).filter(key => key.startsWith(this.prefix)).length 
        : 0
    };
  }
}

// Create cache instances for different data types
export const authCache = new CacheManager({ 
  ttl: 10 * 60 * 1000, // 10 minutes for auth data
  storage: 'both',
  prefix: 'repodock_auth_'
});

export const dataCache = new CacheManager({ 
  ttl: 5 * 60 * 1000, // 5 minutes for general data
  storage: 'both',
  prefix: 'repodock_data_'
});

export const sessionCache = new CacheManager({ 
  ttl: 2 * 60 * 1000, // 2 minutes for session data
  storage: 'memory', // Session data only in memory for security
  prefix: 'repodock_session_'
});

// Utility functions for common cache operations
export const cacheUtils = {
  // Generate cache keys
  userKey: (userId: string) => `user_${userId}`,
  workspacesKey: (userId: string) => `workspaces_${userId}`,
  projectsKey: (workspaceId: string) => `projects_${workspaceId}`,
  tasksKey: (projectId: string) => `tasks_${projectId}`,
  envVarsKey: (projectId?: string) => projectId ? `envvars_${projectId}` : 'envvars_global',
  
  // Invalidate related data
  invalidateUserData: (userId: string) => {
    dataCache.invalidatePattern(`.*${userId}.*`);
  },
  
  invalidateWorkspaceData: (workspaceId: string) => {
    dataCache.invalidatePattern(`.*${workspaceId}.*`);
  },
  
  invalidateProjectData: (projectId: string) => {
    dataCache.invalidatePattern(`.*${projectId}.*`);
  }
};
