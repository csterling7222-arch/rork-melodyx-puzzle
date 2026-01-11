import { Platform, InteractionManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackPerformance, addBreadcrumb } from './errorTracking';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  audioLatency: number;
  networkLatency: number;
  batteryLevel: number;
  thermalState: 'nominal' | 'fair' | 'serious' | 'critical';
}

export interface OptimizationConfig {
  targetFPS: number;
  maxRenderBudgetMs: number;
  enableBatching: boolean;
  enableThrottling: boolean;
  enableMemoryManagement: boolean;
  enableAssetCompression: boolean;
  lowPowerMode: boolean;
}

const DEFAULT_CONFIG: OptimizationConfig = {
  targetFPS: 60,
  maxRenderBudgetMs: 16,
  enableBatching: true,
  enableThrottling: true,
  enableMemoryManagement: true,
  enableAssetCompression: true,
  lowPowerMode: false,
};

const PERF_CONFIG_KEY = 'melodyx_perf_config';

class PerformanceOptimizer {
  private config: OptimizationConfig = DEFAULT_CONFIG;
  private frameTimestamps: number[] = [];
  private currentFPS: number = 60;
  private isMonitoring: boolean = false;
  private throttledCallbacks: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private batchedUpdates: Map<string, (() => void)[]> = new Map();
  private memoryWarningCount: number = 0;
  private renderTimes: number[] = [];

  async init(): Promise<void> {
    console.log('[PerformanceOptimizer] Initializing...');
    
    try {
      const stored = await AsyncStorage.getItem(PERF_CONFIG_KEY);
      if (stored) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.log('[PerformanceOptimizer] Load config error:', error);
    }
    
    this.startMonitoring();
    console.log('[PerformanceOptimizer] Initialized with config:', this.config);
  }

  private startMonitoring(): void {
    if (this.isMonitoring || Platform.OS === 'web') return;
    
    this.isMonitoring = true;
    
    const measureFPS = () => {
      if (!this.isMonitoring) return;
      
      const now = Date.now();
      this.frameTimestamps.push(now);
      
      while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
        this.frameTimestamps.shift();
      }
      
      this.currentFPS = this.frameTimestamps.length;
      
      if (this.currentFPS < 30 && this.config.enableThrottling) {
        this.applyLowPerformanceOptimizations();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private applyLowPerformanceOptimizations(): void {
    console.log('[PerformanceOptimizer] Low FPS detected, applying optimizations');
    
    addBreadcrumb({
      category: 'performance',
      message: `Low FPS: ${this.currentFPS}`,
      level: 'warning',
    });
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getMetrics(): PerformanceMetrics {
    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length
      : 0;
    
    return {
      fps: this.currentFPS,
      memoryUsage: this.estimateMemoryUsage(),
      renderTime: avgRenderTime,
      audioLatency: 0,
      networkLatency: 0,
      batteryLevel: 100,
      thermalState: 'nominal',
    };
  }

  private estimateMemoryUsage(): number {
    return this.frameTimestamps.length * 0.01 + this.renderTimes.length * 0.005;
  }

  throttle<T extends (...args: unknown[]) => void>(
    key: string,
    callback: T,
    delayMs: number = 100
  ): T {
    if (!this.config.enableThrottling) {
      return callback;
    }
    
    return ((...args: Parameters<T>) => {
      const existing = this.throttledCallbacks.get(key);
      if (existing) {
        clearTimeout(existing);
      }
      
      const timeout = setTimeout(() => {
        callback(...args);
        this.throttledCallbacks.delete(key);
      }, delayMs);
      
      this.throttledCallbacks.set(key, timeout);
    }) as T;
  }

  debounce<T extends (...args: unknown[]) => void>(
    key: string,
    callback: T,
    delayMs: number = 250
  ): T {
    return ((...args: Parameters<T>) => {
      const existing = this.throttledCallbacks.get(key);
      if (existing) {
        clearTimeout(existing);
      }
      
      const timeout = setTimeout(() => {
        callback(...args);
        this.throttledCallbacks.delete(key);
      }, delayMs);
      
      this.throttledCallbacks.set(key, timeout);
    }) as T;
  }

  batchUpdate(key: string, update: () => void): void {
    if (!this.config.enableBatching) {
      update();
      return;
    }
    
    if (!this.batchedUpdates.has(key)) {
      this.batchedUpdates.set(key, []);
      
      InteractionManager.runAfterInteractions(() => {
        const updates = this.batchedUpdates.get(key) || [];
        this.batchedUpdates.delete(key);
        
        const start = Date.now();
        updates.forEach(u => u());
        const duration = Date.now() - start;
        
        trackPerformance(`batch_update_${key}`, duration);
      });
    }
    
    this.batchedUpdates.get(key)!.push(update);
  }

  measureRender(componentName: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      this.renderTimes.push(duration);
      
      if (this.renderTimes.length > 100) {
        this.renderTimes.shift();
      }
      
      if (duration > this.config.maxRenderBudgetMs) {
        console.warn(`[PerformanceOptimizer] Slow render: ${componentName} took ${duration}ms`);
        trackPerformance(`slow_render_${componentName}`, duration);
      }
    };
  }

  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await operation();
      trackPerformance(name, Date.now() - start);
      return result;
    } catch (error) {
      trackPerformance(name, Date.now() - start, { error: 'true' });
      throw error;
    }
  }

  reportMemoryWarning(): void {
    this.memoryWarningCount++;
    console.warn('[PerformanceOptimizer] Memory warning #', this.memoryWarningCount);
    
    addBreadcrumb({
      category: 'performance',
      message: `Memory warning #${this.memoryWarningCount}`,
      level: 'warning',
    });
    
    if (this.memoryWarningCount >= 2) {
      this.enableLowPowerMode();
    }
  }

  enableLowPowerMode(): void {
    this.config.lowPowerMode = true;
    this.saveConfig();
    console.log('[PerformanceOptimizer] Low power mode enabled');
  }

  disableLowPowerMode(): void {
    this.config.lowPowerMode = false;
    this.saveConfig();
    console.log('[PerformanceOptimizer] Low power mode disabled');
  }

  isLowPowerMode(): boolean {
    return this.config.lowPowerMode;
  }

  updateConfig(updates: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(PERF_CONFIG_KEY, JSON.stringify(this.config));
    } catch (error) {
      console.log('[PerformanceOptimizer] Save config error:', error);
    }
  }

  scheduleIdleTask(task: () => void, timeout: number = 2000): void {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => task(), { timeout });
    } else {
      setTimeout(task, 0);
    }
  }

  runAfterInteractions(task: () => void): Promise<void> {
    return new Promise(resolve => {
      InteractionManager.runAfterInteractions(() => {
        task();
        resolve();
      });
    });
  }

  cleanup(): void {
    this.isMonitoring = false;
    this.throttledCallbacks.forEach(timeout => clearTimeout(timeout));
    this.throttledCallbacks.clear();
    this.batchedUpdates.clear();
    console.log('[PerformanceOptimizer] Cleanup complete');
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

export function initPerformanceOptimizer(): Promise<void> {
  return performanceOptimizer.init();
}

export function getCurrentFPS(): number {
  return performanceOptimizer.getCurrentFPS();
}

export function getPerformanceMetrics(): PerformanceMetrics {
  return performanceOptimizer.getMetrics();
}

export function throttle<T extends (...args: unknown[]) => void>(
  key: string,
  callback: T,
  delayMs?: number
): T {
  return performanceOptimizer.throttle(key, callback, delayMs);
}

export function debounce<T extends (...args: unknown[]) => void>(
  key: string,
  callback: T,
  delayMs?: number
): T {
  return performanceOptimizer.debounce(key, callback, delayMs);
}

export function batchUpdate(key: string, update: () => void): void {
  performanceOptimizer.batchUpdate(key, update);
}

export function measureRender(componentName: string): () => void {
  return performanceOptimizer.measureRender(componentName);
}

export function measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
  return performanceOptimizer.measureAsync(name, operation);
}

export function reportMemoryWarning(): void {
  performanceOptimizer.reportMemoryWarning();
}

export function runAfterInteractions(task: () => void): Promise<void> {
  return performanceOptimizer.runAfterInteractions(task);
}

export function scheduleIdleTask(task: () => void, timeout?: number): void {
  performanceOptimizer.scheduleIdleTask(task, timeout);
}
