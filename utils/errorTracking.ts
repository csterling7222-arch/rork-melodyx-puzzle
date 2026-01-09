import { Platform, Dimensions, PixelRatio } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const BUG_REPORTS_KEY = 'melodyx_bug_reports';
const GLITCH_SETTINGS_KEY = 'melodyx_glitch_settings';

export interface GlitchReport {
  id: string;
  timestamp: string;
  description: string;
  category: 'audio' | 'visual' | 'performance' | 'crash' | 'other';
  screenshot?: string;
  deviceInfo: DeviceInfo;
  sessionId: string;
  errorBuffer: ErrorEvent[];
  performanceBuffer: PerformanceMetric[];
  status: 'pending' | 'reviewed' | 'resolved';
}

export interface DeviceInfo {
  platform: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isLowEndDevice: boolean;
  memoryWarnings: number;
}

export interface AdaptiveSettings {
  audioQuality: 'low' | 'medium' | 'high';
  animationsEnabled: boolean;
  particleCount: number;
  hapticIntensity: 'off' | 'low' | 'high';
  preloadCount: number;
}

const DEFAULT_ADAPTIVE_SETTINGS: AdaptiveSettings = {
  audioQuality: 'high',
  animationsEnabled: true,
  particleCount: 100,
  hapticIntensity: 'high',
  preloadCount: 12,
};

class ErrorTracker {
  private isInitialized = false;
  private userId: string | null = null;
  private userEmail: string | null = null;
  private userName: string | null = null;
  private sessionId: string = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  private deviceInfo: DeviceInfo;
  private adaptiveSettings: AdaptiveSettings = DEFAULT_ADAPTIVE_SETTINGS;
  private frameTimestamps: number[] = [];
  private currentFPS: number = 60;
  private memoryWarningCount: number = 0;
  private glitchReports: GlitchReport[] = [];

  constructor() {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const isLowEnd = pixelRatio < 2 || (width * height) < 400000;
    
    this.deviceInfo = {
      platform: Platform.OS,
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      isLowEndDevice: isLowEnd,
      memoryWarnings: 0,
    };
    
    if (isLowEnd) {
      this.adaptiveSettings = {
        audioQuality: 'medium',
        animationsEnabled: true,
        particleCount: 50,
        hapticIntensity: 'low',
        preloadCount: 6,
      };
    }
  }

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
    
    this.loadGlitchReports();
    this.loadAdaptiveSettings();
    this.startFPSMonitoring();
    
    console.log('[ErrorTracker] Device info:', this.deviceInfo);
    console.log('[ErrorTracker] Adaptive settings:', this.adaptiveSettings);
  }

  private startFPSMonitoring() {
    if (Platform.OS === 'web') return;
    
    const measureFPS = () => {
      const now = Date.now();
      this.frameTimestamps.push(now);
      
      while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
        this.frameTimestamps.shift();
      }
      
      this.currentFPS = this.frameTimestamps.length;
      
      if (this.currentFPS < 30 && this.frameTimestamps.length > 10) {
        console.warn('[ErrorTracker] Low FPS detected:', this.currentFPS);
        this.autoOptimize();
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private autoOptimize() {
    if (this.currentFPS < 20) {
      this.adaptiveSettings.animationsEnabled = false;
      this.adaptiveSettings.particleCount = 20;
      this.adaptiveSettings.audioQuality = 'low';
      console.log('[ErrorTracker] Auto-optimizing for very low FPS');
    } else if (this.currentFPS < 40) {
      this.adaptiveSettings.particleCount = Math.max(30, this.adaptiveSettings.particleCount - 20);
      console.log('[ErrorTracker] Auto-optimizing for low FPS');
    }
    
    this.saveAdaptiveSettings();
  }

  private async loadGlitchReports() {
    try {
      const stored = await AsyncStorage.getItem(BUG_REPORTS_KEY);
      if (stored) {
        this.glitchReports = JSON.parse(stored);
        console.log('[ErrorTracker] Loaded', this.glitchReports.length, 'pending bug reports');
      }
    } catch (error) {
      console.log('[ErrorTracker] Failed to load bug reports:', error);
    }
  }

  private async saveGlitchReports() {
    try {
      await AsyncStorage.setItem(BUG_REPORTS_KEY, JSON.stringify(this.glitchReports.slice(-20)));
    } catch (error) {
      console.log('[ErrorTracker] Failed to save bug reports:', error);
    }
  }

  private async loadAdaptiveSettings() {
    try {
      const stored = await AsyncStorage.getItem(GLITCH_SETTINGS_KEY);
      if (stored) {
        this.adaptiveSettings = { ...this.adaptiveSettings, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.log('[ErrorTracker] Failed to load adaptive settings:', error);
    }
  }

  private async saveAdaptiveSettings() {
    try {
      await AsyncStorage.setItem(GLITCH_SETTINGS_KEY, JSON.stringify(this.adaptiveSettings));
    } catch (error) {
      console.log('[ErrorTracker] Failed to save adaptive settings:', error);
    }
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

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getDeviceInfo(): DeviceInfo {
    return { ...this.deviceInfo };
  }

  getAdaptiveSettings(): AdaptiveSettings {
    return { ...this.adaptiveSettings };
  }

  updateAdaptiveSettings(settings: Partial<AdaptiveSettings>) {
    this.adaptiveSettings = { ...this.adaptiveSettings, ...settings };
    this.saveAdaptiveSettings();
    console.log('[ErrorTracker] Adaptive settings updated:', this.adaptiveSettings);
  }

  reportMemoryWarning() {
    this.memoryWarningCount++;
    this.deviceInfo.memoryWarnings = this.memoryWarningCount;
    
    console.warn('[ErrorTracker] Memory warning #', this.memoryWarningCount);
    
    if (this.memoryWarningCount >= 2) {
      this.adaptiveSettings.preloadCount = Math.max(4, this.adaptiveSettings.preloadCount - 2);
      this.adaptiveSettings.particleCount = Math.max(20, this.adaptiveSettings.particleCount - 30);
      this.saveAdaptiveSettings();
    }
  }

  async submitGlitchReport(
    description: string, 
    category: GlitchReport['category'] = 'other',
    screenshot?: string
  ): Promise<string> {
    const report: GlitchReport = {
      id: `glitch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      description,
      category,
      screenshot,
      deviceInfo: this.getDeviceInfo(),
      sessionId: this.sessionId,
      errorBuffer: this.getErrorBuffer().slice(-10),
      performanceBuffer: this.getPerformanceBuffer().slice(-20),
      status: 'pending',
    };
    
    this.glitchReports.push(report);
    await this.saveGlitchReports();
    
    console.log('[ErrorTracker] Glitch report submitted:', report.id);
    this.captureMessage(`Glitch Report: ${description}`, 'warning', {
      tags: { category, reportId: report.id },
    });
    
    return report.id;
  }

  getPendingGlitchReports(): GlitchReport[] {
    return this.glitchReports.filter(r => r.status === 'pending');
  }

  async markReportReviewed(reportId: string) {
    const report = this.glitchReports.find(r => r.id === reportId);
    if (report) {
      report.status = 'reviewed';
      await this.saveGlitchReports();
    }
  }

  isLowEndDevice(): boolean {
    return this.deviceInfo.isLowEndDevice;
  }

  shouldReduceAnimations(): boolean {
    return !this.adaptiveSettings.animationsEnabled || this.currentFPS < 40;
  }

  getOptimalParticleCount(): number {
    if (this.currentFPS < 30) return Math.min(20, this.adaptiveSettings.particleCount);
    if (this.currentFPS < 45) return Math.min(50, this.adaptiveSettings.particleCount);
    return this.adaptiveSettings.particleCount;
  }

  resetAdaptiveSettings() {
    this.adaptiveSettings = this.deviceInfo.isLowEndDevice 
      ? {
          audioQuality: 'medium',
          animationsEnabled: true,
          particleCount: 50,
          hapticIntensity: 'low',
          preloadCount: 6,
        }
      : DEFAULT_ADAPTIVE_SETTINGS;
    this.saveAdaptiveSettings();
    console.log('[ErrorTracker] Adaptive settings reset');
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

export function getCurrentFPS(): number {
  return errorTracker.getCurrentFPS();
}

export function getDeviceInfo(): DeviceInfo {
  return errorTracker.getDeviceInfo();
}

export function getAdaptiveSettings(): AdaptiveSettings {
  return errorTracker.getAdaptiveSettings();
}

export function updateAdaptiveSettings(settings: Partial<AdaptiveSettings>) {
  errorTracker.updateAdaptiveSettings(settings);
}

export function reportMemoryWarning() {
  errorTracker.reportMemoryWarning();
}

export async function submitGlitchReport(
  description: string,
  category: GlitchReport['category'] = 'other',
  screenshot?: string
): Promise<string> {
  return errorTracker.submitGlitchReport(description, category, screenshot);
}

export function getPendingGlitchReports(): GlitchReport[] {
  return errorTracker.getPendingGlitchReports();
}

export function isLowEndDevice(): boolean {
  return errorTracker.isLowEndDevice();
}

export function shouldReduceAnimations(): boolean {
  return errorTracker.shouldReduceAnimations();
}

export function getOptimalParticleCount(): number {
  return errorTracker.getOptimalParticleCount();
}

export function resetAdaptiveSettings() {
  errorTracker.resetAdaptiveSettings();
}

export type { PerformanceMetric };
