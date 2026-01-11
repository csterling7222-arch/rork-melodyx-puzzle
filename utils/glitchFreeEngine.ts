import { Platform, Dimensions, PixelRatio, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureError, addBreadcrumb } from './errorTracking';

export type PerformanceLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface DeviceCapabilities {
  performanceLevel: PerformanceLevel;
  networkQuality: NetworkQuality;
  batteryOptimized: boolean;
  memoryPressure: boolean;
  isLowEndDevice: boolean;
  screenDensity: number;
  totalMemoryEstimate: number;
}

export interface AdaptiveConfig {
  audioQuality: 'low' | 'medium' | 'high';
  audioPreloadCount: number;
  animationsEnabled: boolean;
  particleCount: number;
  hapticIntensity: 'off' | 'low' | 'medium' | 'high';
  transitionDuration: number;
  imageQuality: 'low' | 'medium' | 'high';
  cacheSize: number;
  backgroundTasksEnabled: boolean;
  autoPlayEnabled: boolean;
}

export interface SessionEvent {
  type: 'navigation' | 'interaction' | 'error' | 'performance' | 'audio' | 'network';
  timestamp: number;
  data: Record<string, unknown>;
}

export interface GlitchDiagnostics {
  sessionId: string;
  startTime: number;
  events: SessionEvent[];
  performanceSnapshots: PerformanceSnapshot[];
  deviceCapabilities: DeviceCapabilities;
  adaptiveConfig: AdaptiveConfig;
  crashCount: number;
  networkChanges: number;
  memoryWarnings: number;
}

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  networkLatency: number;
  audioLatency: number;
  renderTime: number;
}

const ENGINE_CONFIG_KEY = 'melodyx_glitch_engine_config';
const SESSION_EVENTS_KEY = 'melodyx_session_events';
const MAX_SESSION_EVENTS = 200;
const MAX_PERFORMANCE_SNAPSHOTS = 50;
const PERFORMANCE_SNAPSHOT_INTERVAL = 5000;

const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  audioQuality: 'high',
  audioPreloadCount: 12,
  animationsEnabled: true,
  particleCount: 100,
  hapticIntensity: 'high',
  transitionDuration: 300,
  imageQuality: 'high',
  cacheSize: 50,
  backgroundTasksEnabled: true,
  autoPlayEnabled: true,
};

const LOW_END_CONFIG: AdaptiveConfig = {
  audioQuality: 'medium',
  audioPreloadCount: 6,
  animationsEnabled: true,
  particleCount: 30,
  hapticIntensity: 'low',
  transitionDuration: 200,
  imageQuality: 'medium',
  cacheSize: 25,
  backgroundTasksEnabled: false,
  autoPlayEnabled: true,
};

const MINIMAL_CONFIG: AdaptiveConfig = {
  audioQuality: 'low',
  audioPreloadCount: 4,
  animationsEnabled: false,
  particleCount: 10,
  hapticIntensity: 'off',
  transitionDuration: 150,
  imageQuality: 'low',
  cacheSize: 15,
  backgroundTasksEnabled: false,
  autoPlayEnabled: false,
};

class GlitchFreeEngine {
  private sessionId: string;
  private startTime: number;
  private events: SessionEvent[] = [];
  private performanceSnapshots: PerformanceSnapshot[] = [];
  private deviceCapabilities: DeviceCapabilities;
  private adaptiveConfig: AdaptiveConfig;
  private isInitialized = false;
  private fpsHistory: number[] = [];
  private currentFPS = 60;
  private frameTimestamps: number[] = [];
  private networkState: { isConnected: boolean; type: string } | null = null;
  private appState: AppStateStatus = 'active';
  private crashCount = 0;
  private networkChanges = 0;
  private memoryWarnings = 0;
  private performanceMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private fpsMonitorInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = Date.now();
    this.deviceCapabilities = this.detectDeviceCapabilities();
    this.adaptiveConfig = this.getInitialConfig();
    
    console.log('[GlitchFreeEngine] Created with session:', this.sessionId);
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[GlitchFreeEngine] Initializing...');
    
    await this.loadStoredConfig();
    this.setupNetworkMonitoring();
    this.setupAppStateMonitoring();
    this.startPerformanceMonitoring();
    this.startFPSMonitoring();
    
    this.isInitialized = true;
    this.logEvent('performance', { action: 'engine_initialized', capabilities: this.deviceCapabilities });
    
    console.log('[GlitchFreeEngine] Initialized successfully');
    console.log('[GlitchFreeEngine] Device capabilities:', this.deviceCapabilities);
    console.log('[GlitchFreeEngine] Adaptive config:', this.adaptiveConfig);
    
    addBreadcrumb({ 
      category: 'glitch-engine', 
      message: 'Engine initialized', 
      level: 'info',
      data: { performanceLevel: this.deviceCapabilities.performanceLevel }
    });
  }

  private detectDeviceCapabilities(): DeviceCapabilities {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const screenArea = width * height;
    const totalPixels = screenArea * pixelRatio * pixelRatio;
    
    const isLowEnd = pixelRatio < 2 || screenArea < 400000;
    const isHighEnd = pixelRatio >= 3 && screenArea > 800000;
    
    let performanceLevel: PerformanceLevel;
    if (isHighEnd) {
      performanceLevel = 'ultra';
    } else if (pixelRatio >= 2.5 && screenArea > 600000) {
      performanceLevel = 'high';
    } else if (pixelRatio >= 2 && screenArea > 400000) {
      performanceLevel = 'medium';
    } else if (isLowEnd) {
      performanceLevel = 'low';
    } else {
      performanceLevel = 'minimal';
    }
    
    const memoryEstimate = totalPixels > 2000000 ? 4096 : 
                          totalPixels > 1000000 ? 2048 : 1024;
    
    return {
      performanceLevel,
      networkQuality: 'good',
      batteryOptimized: false,
      memoryPressure: false,
      isLowEndDevice: isLowEnd,
      screenDensity: pixelRatio,
      totalMemoryEstimate: memoryEstimate,
    };
  }

  private getInitialConfig(): AdaptiveConfig {
    const { performanceLevel } = this.deviceCapabilities;
    
    switch (performanceLevel) {
      case 'ultra':
      case 'high':
        return { ...DEFAULT_ADAPTIVE_CONFIG };
      case 'medium':
        return { 
          ...DEFAULT_ADAPTIVE_CONFIG,
          particleCount: 60,
          audioPreloadCount: 10,
        };
      case 'low':
        return { ...LOW_END_CONFIG };
      case 'minimal':
        return { ...MINIMAL_CONFIG };
      default:
        return { ...DEFAULT_ADAPTIVE_CONFIG };
    }
  }

  private async loadStoredConfig(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ENGINE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.adaptiveConfig = { ...this.adaptiveConfig, ...parsed };
        console.log('[GlitchFreeEngine] Loaded stored config');
      }
    } catch (error) {
      console.log('[GlitchFreeEngine] Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem(ENGINE_CONFIG_KEY, JSON.stringify(this.adaptiveConfig));
    } catch (error) {
      console.log('[GlitchFreeEngine] Failed to save config:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'onLine' in navigator) {
        const updateNetworkState = () => {
          const isOnline = navigator.onLine;
          const previousQuality = this.deviceCapabilities.networkQuality;
          this.networkState = { isConnected: isOnline, type: isOnline ? 'unknown' : 'none' };
          this.deviceCapabilities.networkQuality = isOnline ? 'good' : 'offline';
          
          if (previousQuality !== this.deviceCapabilities.networkQuality) {
            this.networkChanges++;
            this.logEvent('network', { 
              previousQuality, 
              newQuality: this.deviceCapabilities.networkQuality,
              isConnected: isOnline,
            });
            this.adaptToConditions();
            this.emit('networkChange', { quality: this.deviceCapabilities.networkQuality });
          }
        };
        
        window.addEventListener('online', updateNetworkState);
        window.addEventListener('offline', updateNetworkState);
        updateNetworkState();
      }
      return;
    }
    
    this.networkState = { isConnected: true, type: 'unknown' };
    this.deviceCapabilities.networkQuality = 'good';
    console.log('[GlitchFreeEngine] Basic network monitoring active');
  }

  private determineNetworkQuality(state: { isConnected: boolean; type: string }): NetworkQuality {
    if (!state.isConnected) return 'offline';
    
    if (state.type === 'wifi') {
      return 'excellent';
    } else if (state.type === 'cellular') {
      return 'good';
    }
    
    return 'good';
  }

  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextAppState) => {
      const previousState = this.appState;
      this.appState = nextAppState;
      
      this.logEvent('performance', { 
        action: 'app_state_change',
        previousState, 
        newState: nextAppState 
      });
      
      if (nextAppState === 'active' && previousState !== 'active') {
        this.onAppForeground();
      } else if (nextAppState === 'background') {
        this.onAppBackground();
      }
    });
  }

  private onAppForeground(): void {
    console.log('[GlitchFreeEngine] App foregrounded');
    this.startPerformanceMonitoring();
    this.emit('appForeground', {});
  }

  private onAppBackground(): void {
    console.log('[GlitchFreeEngine] App backgrounded');
    this.stopPerformanceMonitoring();
    this.saveSessionEvents();
    this.emit('appBackground', {});
  }

  private startPerformanceMonitoring(): void {
    if (this.performanceMonitorInterval) return;
    
    this.performanceMonitorInterval = setInterval(() => {
      this.takePerformanceSnapshot();
    }, PERFORMANCE_SNAPSHOT_INTERVAL);
  }

  private stopPerformanceMonitoring(): void {
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
      this.performanceMonitorInterval = null;
    }
  }

  private startFPSMonitoring(): void {
    if (Platform.OS === 'web') return;
    
    const measureFPS = () => {
      const now = Date.now();
      this.frameTimestamps.push(now);
      
      while (this.frameTimestamps.length > 0 && this.frameTimestamps[0] < now - 1000) {
        this.frameTimestamps.shift();
      }
      
      this.currentFPS = this.frameTimestamps.length;
      this.fpsHistory.push(this.currentFPS);
      
      if (this.fpsHistory.length > 20) {
        this.fpsHistory.shift();
      }
      
      if (this.currentFPS < 30 && this.fpsHistory.length >= 5) {
        const avgFPS = this.fpsHistory.slice(-5).reduce((a, b) => a + b, 0) / 5;
        if (avgFPS < 30) {
          this.handleLowFPS(avgFPS);
        }
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private handleLowFPS(avgFPS: number): void {
    console.warn('[GlitchFreeEngine] Low FPS detected:', avgFPS);
    
    this.logEvent('performance', { 
      action: 'low_fps_detected',
      avgFPS,
      currentConfig: this.adaptiveConfig.particleCount,
    });
    
    if (avgFPS < 20) {
      this.adaptiveConfig.animationsEnabled = false;
      this.adaptiveConfig.particleCount = Math.min(10, this.adaptiveConfig.particleCount);
    } else if (avgFPS < 40) {
      this.adaptiveConfig.particleCount = Math.max(20, this.adaptiveConfig.particleCount - 20);
    }
    
    this.saveConfig();
    this.emit('performanceAdjusted', { fps: avgFPS, config: this.adaptiveConfig });
  }

  private takePerformanceSnapshot(): void {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      fps: this.currentFPS,
      memoryUsage: this.estimateMemoryUsage(),
      networkLatency: this.estimateNetworkLatency(),
      audioLatency: 0,
      renderTime: 0,
    };
    
    this.performanceSnapshots.push(snapshot);
    
    if (this.performanceSnapshots.length > MAX_PERFORMANCE_SNAPSHOTS) {
      this.performanceSnapshots.shift();
    }
  }

  private estimateMemoryUsage(): number {
    return this.events.length * 0.5 + this.performanceSnapshots.length * 0.2;
  }

  private estimateNetworkLatency(): number {
    const quality = this.deviceCapabilities.networkQuality;
    switch (quality) {
      case 'excellent': return 50;
      case 'good': return 100;
      case 'fair': return 250;
      case 'poor': return 500;
      case 'offline': return -1;
      default: return 100;
    }
  }

  private adaptToConditions(): void {
    const { networkQuality, memoryPressure, performanceLevel } = this.deviceCapabilities;
    
    if (networkQuality === 'offline' || networkQuality === 'poor') {
      this.adaptiveConfig.audioQuality = 'low';
      this.adaptiveConfig.audioPreloadCount = 4;
      this.adaptiveConfig.imageQuality = 'low';
    } else if (networkQuality === 'fair') {
      this.adaptiveConfig.audioQuality = 'medium';
      this.adaptiveConfig.audioPreloadCount = 6;
    }
    
    if (memoryPressure) {
      this.adaptiveConfig.cacheSize = Math.max(10, this.adaptiveConfig.cacheSize - 10);
      this.adaptiveConfig.particleCount = Math.max(20, this.adaptiveConfig.particleCount - 30);
    }
    
    if (performanceLevel === 'low' || performanceLevel === 'minimal') {
      this.adaptiveConfig.transitionDuration = 150;
      this.adaptiveConfig.backgroundTasksEnabled = false;
    }
    
    this.saveConfig();
    console.log('[GlitchFreeEngine] Adapted to conditions:', this.adaptiveConfig);
  }

  logEvent(type: SessionEvent['type'], data: Record<string, unknown>): void {
    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    this.events.push(event);
    
    if (this.events.length > MAX_SESSION_EVENTS) {
      this.events.shift();
    }
    
    if (type === 'error') {
      console.log('[GlitchFreeEngine] Error event:', data);
    }
  }

  logNavigation(screen: string, params?: Record<string, unknown>): void {
    this.logEvent('navigation', { screen, params, timestamp: Date.now() });
    addBreadcrumb({ category: 'navigation', message: `Navigate to ${screen}`, level: 'info' });
  }

  logInteraction(action: string, target: string, extra?: Record<string, unknown>): void {
    this.logEvent('interaction', { action, target, ...extra });
  }

  logAudioEvent(action: string, details: Record<string, unknown>): void {
    this.logEvent('audio', { action, ...details });
  }

  reportCrash(error: Error, context?: Record<string, unknown>): void {
    this.crashCount++;
    this.logEvent('error', { 
      type: 'crash',
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      context,
      crashCount: this.crashCount,
    });
    captureError(error, { extra: context });
  }

  reportMemoryWarning(): void {
    this.memoryWarnings++;
    this.deviceCapabilities.memoryPressure = true;
    
    this.logEvent('performance', { 
      action: 'memory_warning',
      count: this.memoryWarnings,
    });
    
    this.adaptToConditions();
    this.emit('memoryWarning', { count: this.memoryWarnings });
  }

  private async saveSessionEvents(): Promise<void> {
    try {
      const sessionData = {
        sessionId: this.sessionId,
        events: this.events.slice(-100),
        savedAt: Date.now(),
      };
      await AsyncStorage.setItem(SESSION_EVENTS_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.log('[GlitchFreeEngine] Failed to save session events:', error);
    }
  }

  getDiagnostics(): GlitchDiagnostics {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: [...this.events],
      performanceSnapshots: [...this.performanceSnapshots],
      deviceCapabilities: { ...this.deviceCapabilities },
      adaptiveConfig: { ...this.adaptiveConfig },
      crashCount: this.crashCount,
      networkChanges: this.networkChanges,
      memoryWarnings: this.memoryWarnings,
    };
  }

  getConfig(): AdaptiveConfig {
    return { ...this.adaptiveConfig };
  }

  updateConfig(updates: Partial<AdaptiveConfig>): void {
    this.adaptiveConfig = { ...this.adaptiveConfig, ...updates };
    this.saveConfig();
    this.emit('configUpdated', this.adaptiveConfig);
  }

  resetConfig(): void {
    this.adaptiveConfig = this.getInitialConfig();
    this.saveConfig();
    this.emit('configReset', this.adaptiveConfig);
  }

  getCurrentFPS(): number {
    return this.currentFPS;
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 60;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  getDeviceCapabilities(): DeviceCapabilities {
    return { ...this.deviceCapabilities };
  }

  isOffline(): boolean {
    return this.deviceCapabilities.networkQuality === 'offline';
  }

  shouldReduceAnimations(): boolean {
    return !this.adaptiveConfig.animationsEnabled || 
           this.currentFPS < 40 || 
           this.deviceCapabilities.performanceLevel === 'minimal';
  }

  shouldReduceParticles(): boolean {
    return this.currentFPS < 45 || this.deviceCapabilities.memoryPressure;
  }

  getOptimalParticleCount(): number {
    if (this.currentFPS < 30) return Math.min(10, this.adaptiveConfig.particleCount);
    if (this.currentFPS < 45) return Math.min(30, this.adaptiveConfig.particleCount);
    return this.adaptiveConfig.particleCount;
  }

  getOptimalTransitionDuration(): number {
    if (this.shouldReduceAnimations()) return 100;
    return this.adaptiveConfig.transitionDuration;
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('[GlitchFreeEngine] Event callback error:', error);
        }
      });
    }
  }

  cleanup(): void {
    this.stopPerformanceMonitoring();
    if (this.fpsMonitorInterval) {
      clearInterval(this.fpsMonitorInterval);
    }
    this.saveSessionEvents();
    this.listeners.clear();
    console.log('[GlitchFreeEngine] Cleanup complete');
  }
}

export const glitchFreeEngine = new GlitchFreeEngine();

export function initGlitchFreeEngine(): Promise<void> {
  return glitchFreeEngine.init();
}

export function getGlitchDiagnostics(): GlitchDiagnostics {
  return glitchFreeEngine.getDiagnostics();
}

export function getAdaptiveConfig(): AdaptiveConfig {
  return glitchFreeEngine.getConfig();
}

export function updateAdaptiveConfig(updates: Partial<AdaptiveConfig>): void {
  glitchFreeEngine.updateConfig(updates);
}

export function logNavigation(screen: string, params?: Record<string, unknown>): void {
  glitchFreeEngine.logNavigation(screen, params);
}

export function logInteraction(action: string, target: string, extra?: Record<string, unknown>): void {
  glitchFreeEngine.logInteraction(action, target, extra);
}

export function logAudioEvent(action: string, details: Record<string, unknown>): void {
  glitchFreeEngine.logAudioEvent(action, details);
}

export function reportCrash(error: Error, context?: Record<string, unknown>): void {
  glitchFreeEngine.reportCrash(error, context);
}

export function reportMemoryWarning(): void {
  glitchFreeEngine.reportMemoryWarning();
}

export function shouldReduceAnimations(): boolean {
  return glitchFreeEngine.shouldReduceAnimations();
}

export function getOptimalParticleCount(): number {
  return glitchFreeEngine.getOptimalParticleCount();
}

export function getOptimalTransitionDuration(): number {
  return glitchFreeEngine.getOptimalTransitionDuration();
}

export function getCurrentFPS(): number {
  return glitchFreeEngine.getCurrentFPS();
}

export function isOffline(): boolean {
  return glitchFreeEngine.isOffline();
}
