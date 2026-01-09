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

class ErrorTracker {
  private isInitialized = false;
  private userId: string | null = null;
  private userEmail: string | null = null;
  private userName: string | null = null;

  init() {
    if (this.isInitialized) return;
    
    console.log('[ErrorTracker] Initializing error tracking...');
    this.isInitialized = true;
    
    if (typeof global !== 'undefined') {
      const originalHandler = (global as typeof globalThis & { ErrorUtils?: { getGlobalHandler: () => ((error: Error, isFatal: boolean) => void); setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void } }).ErrorUtils?.getGlobalHandler?.();
      
      (global as typeof globalThis & { ErrorUtils?: { setGlobalHandler: (handler: (error: Error, isFatal: boolean) => void) => void } }).ErrorUtils?.setGlobalHandler?.((error: Error, isFatal: boolean) => {
        this.captureException(error, {
          tags: { fatal: String(isFatal) },
          extra: { isFatal },
        });
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    console.log('[ErrorTracker] Error tracking initialized for platform:', Platform.OS);
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
    
    const logData = {
      name: errorObj.name,
      message: errorObj.message,
      stack: errorObj.stack?.split('\n').slice(0, 5).join('\n'),
      platform: Platform.OS,
      timestamp: new Date().toISOString(),
      userId: context?.user?.id || this.userId,
      ...context?.tags,
      ...context?.extra,
    };

    console.error('[ErrorTracker] Exception captured:', JSON.stringify(logData, null, 2));
    
    this.sendToRemote('exception', logData);
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
      
      console.log(`[ErrorTracker] Would send ${type} to remote:`, data.message || data.name);
    } catch (err) {
      console.log('[ErrorTracker] Failed to send to remote:', err);
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
