// Location: src/lib/performance.ts
// Description: Performance monitoring and optimization utilities for RepoDock.dev

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled = process.env.NODE_ENV === 'development';

  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  end(name: string): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`, metric.metadata || '');

    return duration;
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  clear(): void {
    this.metrics.clear();
  }

  report(): void {
    if (!this.isEnabled) return;

    const metrics = this.getMetrics();
    if (metrics.length === 0) return;

    console.group('📊 Performance Report');
    metrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(metric => {
        console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`);
      });
    console.groupEnd();
  }
}

// Global performance monitor instance
export const perf = new PerformanceMonitor();

// Performance optimization utilities
export const perfUtils = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Measure component render time
  measureRender(componentName: string) {
    return {
      start: () => perf.start(`render:${componentName}`),
      end: () => perf.end(`render:${componentName}`)
    };
  },

  // Measure API call time
  measureAPI(endpoint: string, method: string = 'GET') {
    return {
      start: () => perf.start(`api:${method}:${endpoint}`),
      end: () => perf.end(`api:${method}:${endpoint}`)
    };
  },

  // Measure data loading time
  measureDataLoad(dataType: string) {
    return {
      start: () => perf.start(`data:${dataType}`),
      end: () => perf.end(`data:${dataType}`)
    };
  }
};

// React hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const renderMetric = perfUtils.measureRender(componentName);
  
  return {
    startRender: renderMetric.start,
    endRender: renderMetric.end,
    measureAsync: (name: string, fn: () => Promise<any>) => 
      perf.measureAsync(`${componentName}:${name}`, fn),
    measure: (name: string, fn: () => any) => 
      perf.measure(`${componentName}:${name}`, fn)
  };
}

// Performance-aware fetch wrapper
export async function performantFetch(
  url: string, 
  options?: RequestInit,
  cacheKey?: string
): Promise<Response> {
  const method = options?.method || 'GET';
  const metric = perfUtils.measureAPI(url, method);
  
  metric.start();
  
  try {
    // Add performance headers
    const enhancedOptions: RequestInit = {
      ...options,
      headers: {
        ...options?.headers,
        'X-Performance-Monitor': 'true'
      }
    };

    const response = await fetch(url, enhancedOptions);
    metric.end();
    
    return response;
  } catch (error) {
    metric.end();
    throw error;
  }
}

// Bundle size analyzer (development only)
export const bundleAnalyzer = {
  logImportSize(moduleName: string, moduleSize?: number) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Loaded module: ${moduleName}${moduleSize ? ` (${moduleSize}kb)` : ''}`);
    }
  },

  measureDynamicImport<T>(moduleName: string, importFn: () => Promise<T>): Promise<T> {
    return perf.measureAsync(`import:${moduleName}`, importFn);
  }
};

// Memory usage monitoring
export const memoryMonitor = {
  log() {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      console.log('🧠 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  },

  startMonitoring(interval: number = 30000) {
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => this.log(), interval);
    }
  }
};

// Initialize memory monitoring in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  memoryMonitor.startMonitoring();
}
