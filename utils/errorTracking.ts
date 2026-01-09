import { Platform } from 'react-native';

type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

interface ErrorContext {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

interface BreadcrumbData {
  category: string;
  message: string;
  level?: SeverityLevel;
  data?: Record<string, unknown>;
}

interface ErrorEvent {
  name: string;
  message: string;
  stack?: string;
  platform: string;
  timestamp: string;
  userId?: string | null;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

const errorBuffer: ErrorEvent[] = [];
const MAX_BUFFER_SIZE = 50;

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  tags?: Record<string, string>;
}

const performanceBuffer: PerformanceMetric[] = [];
const MAX_PERF_BUFFER_SIZE = 100;

class ErrorTracker {
  private isInitialized = false;
  private userId: string | null = null;
  private userEmail: string | null = null;
  private userName: string | null = null;
  private sessionId: string = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  init() {
    if (this.isInitialized) return;
    
    console.log('[ErrorTracker] Initializing error tracking...');
    this.isInitialized = true;
    
    if (typeof global !== 'undefined' && Platform.OS !== 'web') {
      const originalHandler = (global as typeof globalThis & { ErrorUtils?: { getGlobalHandler: () => ((error: Error, isFatal: boolean) => void); setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void } }).ErrorUtils?.getGlobalHandler?.();
      
      (global as typeof globalThis & { ErrorUtils?: { setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void } }).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
        this.captureException(error, {
          tags: { fatal: String(isFatal), sessionId: this.sessionId },
          extra: { isFatal },
        });
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureException(event.error || new Error(event.message), {
          tags: { type: 'uncaught', sessionId: this.sessionId },
          extra: { filename: event.filename, lineno: event.lineno, colno: event.colno },
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureException(event.reason || new Error('Unhandled Promise rejection'), {
          tags: { type: 'unhandledrejection', sessionId: this.sessionId },
        });
      });
    }

    console.log('[ErrorTracker] Error tracking initialized for platform:', Platform.OS, 'session:', this.sessionId);
  }

  setUser(user: { id?: string; email?: string; username?: string } | null) {
    if (user) {
      this.userId = user.id || null;
      this.userEmail = user.email || null;
      this.userName = user.username || null;
      console.log('[ErrorTracker] User set:', user.id || 'anonymous');
    } else {
      this.userId = null;
      this.userEmail = null;
      this.userName = null;
      console.log('[ErrorTracker] User cleared');
    }
  }

  captureException(error: Error | unknown, context?: ErrorContext) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    
    const errorEvent: ErrorEvent = {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack?.split('\n').slice(0, 10).join('\n'),
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      userId: context?.user?.id || this.userId,
      tags: { ...context?.tags, sessionId: this.sessionId },
      extra: context?.extra,
    };

    errorBuffer.push(errorEvent);
    if (errorBuffer.length > MAX_BUFFER_SIZE) {
      errorBuffer.shift();
    }

    console.error('[ErrorTracker] Exception captured:', errorEvent.name, '-', errorEvent.message);
    
    this.sendToRemote('exception', errorEvent as unknown as Record<string, unknown>);
  }

  captureMessage(message: string, level: SeverityLevel = 'info', context?: ErrorContext) {
    const logData = {
      message,
      level,
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      userId: context?.user?.id || this.userId,
      ...context?.tags,
      ...context?.extra,
    };

    const logMethod = level === 'error' || level === 'fatal' ? console.error : 
                      level === 'warning' ? console.warn : console.log;
    
    logMethod(`[ErrorTracker] ${level.toUpperCase()}:`, message);
    
    this.sendToRemote('message', logData);
  }

  addBreadcrumb(breadcrumb: BreadcrumbData) {
    console.log(`[ErrorTracker] Breadcrumb [${breadcrumb.category}]:`, breadcrumb.message);
  }

  setTag(key: string, value: string) {
    console.log(`[ErrorTracker] Tag set: ${key}=${value}`);
  }

  setExtra(key: string, value: unknown) {
    console.log(`[ErrorTracker] Extra set: ${key}=`, value);
  }

  private async sendToRemote(type: 'exception' | 'message', data: Record<string, unknown>) {
    try {
      const endpoint = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
      if (!endpoint) return;
      
      if (__DEV__) {
        console.log(`[ErrorTracker] [${type}]:`, data.message || data.name);
        return;
      }
      
      console.log(`[ErrorTracker] Sending ${type} to remote...`);
    } catch (err) {
      console.log('[ErrorTracker] Failed to send to remote:', err);
    }
  }

  getErrorBuffer(): ErrorEvent[] {
    return [...errorBuffer];
  }

  clearErrorBuffer() {
    errorBuffer.length = 0;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  trackPerformance(name: string, duration: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: new Date().toISOString(),
      tags,
    };

    performanceBuffer.push(metric);
    if (performanceBuffer.length > MAX_PERF_BUFFER_SIZE) {
      performanceBuffer.shift();
    }

    if (duration > 1000) {
      console.warn(`[ErrorTracker] Slow operation: ${name} took ${duration}ms`);
    } else {
      console.log(`[ErrorTracker] Performance: ${name} - ${duration}ms`);
    }
  }

  getPerformanceBuffer(): PerformanceMetric[] {
    return [...performanceBuffer];
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    return fn()
      .then((result) => {
        this.trackPerformance(name, Date.now() - start, tags);
        return result;
      })
      .catch((error) => {
        this.trackPerformance(name, Date.now() - start, { ...tags, error: 'true' });
        this.captureException(error, { tags: { ...tags, operation: name } });
        throw error;
      });
  }

  measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    const start = Date.now();
    try {
      const result = fn();
      this.trackPerformance(name, Date.now() - start, tags);
      return result;
    } catch (error) {
      this.trackPerformance(name, Date.now() - start, { ...tags, error: 'true' });
      this.captureException(error, { tags: { ...tags, operation: name } });
      throw error;
    }
  }

  wrap<T extends (...args: unknown[]) => unknown>(fn: T, context?: ErrorContext): T {
    return ((...args: Parameters<T>) => {
      try {
        const result = fn(...args);
        if (result instanceof Promise) {
          return result.catch((error: unknown) => {
            this.captureException(error, context);
            throw error;
          });
        }
        return result;
      } catch (error) {
        this.captureException(error, context);
        throw error;
      }
    }) as T;
  }
}

export const errorTracker = new ErrorTracker();

export function initErrorTracking() {
  errorTracker.init();
}

export function setErrorTrackingUser(user: { id?: string; email?: string; username?: string } | null) {
  errorTracker.setUser(user);
}

export function captureError(error: Error | unknown, context?: ErrorContext) {
  errorTracker.captureException(error, context);
}

export function captureMessage(message: string, level?: SeverityLevel, context?: ErrorContext) {
  errorTracker.captureMessage(message, level, context);
}

export function addBreadcrumb(breadcrumb: BreadcrumbData) {
  errorTracker.addBreadcrumb(breadcrumb);
}

export function wrapWithErrorTracking<T extends (...args: unknown[]) => unknown>(fn: T, context?: ErrorContext): T {
  return errorTracker.wrap(fn, context);
}

export function trackPerformance(name: string, duration: number, tags?: Record<string, string>) {
  errorTracker.trackPerformance(name, duration, tags);
}

export function measureAsync<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
  return errorTracker.measureAsync(name, fn, tags);
}

export function measureSync<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
  return errorTracker.measureSync(name, fn, tags);
}

export function getPerformanceMetrics(): PerformanceMetric[] {
  return errorTracker.getPerformanceBuffer();
}

export type { PerformanceMetric };
