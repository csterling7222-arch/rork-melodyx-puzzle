
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureError, addBreadcrumb, trackPerformance } from './errorTracking';
import { logInteraction, logAudioEvent, getAdaptiveConfig } from './glitchFreeEngine';

export type FeatureModule = 
  | 'daily' | 'learning' | 'fever' | 'shop' | 'profile'
  | 'duels' | 'events' | 'eco' | 'playlists' | 'wellness'
  | 'tournaments' | 'campaign' | 'auth' | 'instruments';

export interface IntegrationEvent {
  source: FeatureModule;
  target: FeatureModule;
  action: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface CrossFeatureSync {
  premiumUnlocks: boolean;
  instrumentId: string;
  themeId: string;
  audioSettings: {
    quality: 'low' | 'medium' | 'high';
    hapticEnabled: boolean;
    volume: number;
  };
  userLevel: number;
  totalXp: number;
}

const INTEGRATION_LOG_KEY = 'melodyx_integration_log';
const SYNC_STATE_KEY = 'melodyx_sync_state';
const MAX_LOG_ENTRIES = 100;

class SystemIntegrator {
  private eventLog: IntegrationEvent[] = [];
  private syncState: CrossFeatureSync = {
    premiumUnlocks: false,
    instrumentId: 'piano',
    themeId: 'default',
    audioSettings: {
      quality: 'high',
      hapticEnabled: true,
      volume: 0.8,
    },
    userLevel: 1,
    totalXp: 0,
  };
  private listeners: Map<string, Set<(event: IntegrationEvent) => void>> = new Map();
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[SystemIntegrator] Initializing...');
    
    try {
      await this.loadState();
      this.isInitialized = true;
      console.log('[SystemIntegrator] Initialized successfully');
    } catch (error) {
      console.error('[SystemIntegrator] Init error:', error);
      captureError(error, { tags: { component: 'SystemIntegrator' } });
    }
  }

  private async loadState(): Promise<void> {
    try {
      const [logData, syncData] = await Promise.all([
        AsyncStorage.getItem(INTEGRATION_LOG_KEY),
        AsyncStorage.getItem(SYNC_STATE_KEY),
      ]);
      
      if (logData) {
        this.eventLog = JSON.parse(logData);
      }
      if (syncData) {
        this.syncState = { ...this.syncState, ...JSON.parse(syncData) };
      }
    } catch (error) {
      console.log('[SystemIntegrator] Load state error:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem(INTEGRATION_LOG_KEY, JSON.stringify(this.eventLog.slice(-MAX_LOG_ENTRIES))),
        AsyncStorage.setItem(SYNC_STATE_KEY, JSON.stringify(this.syncState)),
      ]);
    } catch (error) {
      console.log('[SystemIntegrator] Save state error:', error);
    }
  }

  logCrossFeatureEvent(
    source: FeatureModule,
    target: FeatureModule,
    action: string,
    data?: Record<string, unknown>
  ): void {
    const event: IntegrationEvent = {
      source,
      target,
      action,
      data,
      timestamp: Date.now(),
    };
    
    this.eventLog.push(event);
    if (this.eventLog.length > MAX_LOG_ENTRIES) {
      this.eventLog.shift();
    }
    
    console.log(`[Integration] ${source} -> ${target}: ${action}`);
    addBreadcrumb({ 
      category: 'integration', 
      message: `${source} -> ${target}: ${action}`,
      level: 'info',
      data,
    });
    
    this.emit(`${source}_${target}`, event);
    this.emit('all', event);
    
    this.saveState();
  }

  syncDailyToLearning(songData: { notes: string[]; name: string; artist: string }): void {
    this.logCrossFeatureEvent('daily', 'learning', 'sync_guessed_song', songData);
    logInteraction('cross_feature_sync', 'daily_to_learning', songData);
  }

  syncLearningToDaily(lessonData: { lessonId: string; accuracy: number }): void {
    this.logCrossFeatureEvent('learning', 'daily', 'practice_complete', lessonData);
  }

  syncPremiumUnlocks(isPremium: boolean, features: string[]): void {
    this.syncState.premiumUnlocks = isPremium;
    this.logCrossFeatureEvent('shop', 'instruments', 'premium_sync', { isPremium, features });
    this.logCrossFeatureEvent('shop', 'learning', 'premium_sync', { isPremium, features });
    this.saveState();
  }

  syncInstrumentChange(instrumentId: string): void {
    this.syncState.instrumentId = instrumentId;
    this.logCrossFeatureEvent('instruments', 'daily', 'instrument_change', { instrumentId });
    this.logCrossFeatureEvent('instruments', 'learning', 'instrument_change', { instrumentId });
    this.logCrossFeatureEvent('instruments', 'fever', 'instrument_change', { instrumentId });
    this.saveState();
    
    logAudioEvent('instrument_sync', { instrumentId });
  }

  syncAudioSettings(settings: Partial<CrossFeatureSync['audioSettings']>): void {
    this.syncState.audioSettings = { ...this.syncState.audioSettings, ...settings };
    this.logCrossFeatureEvent('profile', 'daily', 'audio_settings_sync', settings);
    this.saveState();
    
    logAudioEvent('settings_sync', settings);
  }

  syncThemeChange(themeId: string): void {
    this.syncState.themeId = themeId;
    this.logCrossFeatureEvent('profile', 'daily', 'theme_change', { themeId });
    this.saveState();
  }

  syncUserProgress(level: number, xp: number): void {
    this.syncState.userLevel = level;
    this.syncState.totalXp = xp;
    this.logCrossFeatureEvent('profile', 'learning', 'progress_sync', { level, xp });
    this.logCrossFeatureEvent('profile', 'fever', 'progress_sync', { level, xp });
    this.saveState();
  }

  getSyncState(): CrossFeatureSync {
    return { ...this.syncState };
  }

  getEventLog(): IntegrationEvent[] {
    return [...this.eventLog];
  }

  getRecentEvents(count: number = 10): IntegrationEvent[] {
    return this.eventLog.slice(-count);
  }

  getEventsByModule(module: FeatureModule): IntegrationEvent[] {
    return this.eventLog.filter(e => e.source === module || e.target === module);
  }

  on(event: string, callback: (event: IntegrationEvent) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: IntegrationEvent): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (error) {
          console.error('[SystemIntegrator] Listener error:', error);
        }
      });
    }
  }

  validateIntegration(): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    const config = getAdaptiveConfig();
    if (!config.audioQuality) {
      issues.push('Audio quality not configured');
    }
    
    if (!this.syncState.instrumentId) {
      issues.push('No instrument selected');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  async runDiagnostics(): Promise<{
    eventCount: number;
    lastEventTime: number | null;
    syncStateValid: boolean;
    moduleConnections: Record<FeatureModule, number>;
  }> {
    const start = Date.now();
    
    const moduleConnections: Record<string, number> = {};
    const modules: FeatureModule[] = [
      'daily', 'learning', 'fever', 'shop', 'profile',
      'duels', 'events', 'eco', 'playlists', 'wellness',
      'tournaments', 'campaign', 'auth', 'instruments',
    ];
    
    modules.forEach(m => {
      moduleConnections[m] = this.eventLog.filter(e => e.source === m || e.target === m).length;
    });
    
    trackPerformance('integration_diagnostics', Date.now() - start);
    
    return {
      eventCount: this.eventLog.length,
      lastEventTime: this.eventLog.length > 0 ? this.eventLog[this.eventLog.length - 1].timestamp : null,
      syncStateValid: this.validateIntegration().isValid,
      moduleConnections: moduleConnections as Record<FeatureModule, number>,
    };
  }
}

export const systemIntegrator = new SystemIntegrator();

export function initSystemIntegration(): Promise<void> {
  return systemIntegrator.init();
}

export function logCrossFeatureEvent(
  source: FeatureModule,
  target: FeatureModule,
  action: string,
  data?: Record<string, unknown>
): void {
  systemIntegrator.logCrossFeatureEvent(source, target, action, data);
}

export function syncDailyToLearning(songData: { notes: string[]; name: string; artist: string }): void {
  systemIntegrator.syncDailyToLearning(songData);
}

export function syncPremiumUnlocks(isPremium: boolean, features: string[]): void {
  systemIntegrator.syncPremiumUnlocks(isPremium, features);
}

export function syncInstrumentChange(instrumentId: string): void {
  systemIntegrator.syncInstrumentChange(instrumentId);
}

export function getSyncState(): CrossFeatureSync {
  return systemIntegrator.getSyncState();
}

export function onIntegrationEvent(callback: (event: IntegrationEvent) => void): () => void {
  return systemIntegrator.on('all', callback);
}
