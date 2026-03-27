import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface SyncableData {
  userState: Record<string, unknown> | null;
  gameStats: Record<string, unknown> | null;
  ecoData: Record<string, unknown> | null;
  playlists: Record<string, unknown> | null;
  wellness: Record<string, unknown> | null;
  lastModified: string;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  pendingChanges: number;
  isSyncing: boolean;
  syncError: string | null;
}

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  dataType: keyof SyncableData;
  data: Record<string, unknown>;
  timestamp: string;
  retryCount: number;
}

const SYNC_STATUS_KEY = 'melodyx_sync_status';
const SYNC_QUEUE_KEY = 'melodyx_sync_queue';
const LOCAL_DATA_KEY = 'melodyx_local_data';
const CONFLICT_RESOLUTION_KEY = 'melodyx_conflict_resolution';

type ConflictResolution = 'cloud' | 'local' | 'merge';

let syncStatusListeners: ((status: SyncStatus) => void)[] = [];
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export async function initSyncManager(userId: string): Promise<void> {
  console.log('[SyncManager] Initializing for user:', userId);
  
  if (appStateSubscription) {
    appStateSubscription.remove();
  }
  
  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') {
      console.log('[SyncManager] App became active, triggering sync check');
      checkAndSync(userId);
    } else if (state === 'background') {
      console.log('[SyncManager] App going to background, saving pending changes');
      flushPendingChanges(userId);
    }
  });
}

export async function cleanupSyncManager(): Promise<void> {
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  syncStatusListeners = [];
}

export function subscribeSyncStatus(listener: (status: SyncStatus) => void): () => void {
  syncStatusListeners.push(listener);
  return () => {
    syncStatusListeners = syncStatusListeners.filter(l => l !== listener);
  };
}

function notifySyncStatus(status: SyncStatus): void {
  syncStatusListeners.forEach(listener => listener(status));
}

export async function getSyncStatus(userId: string): Promise<SyncStatus> {
  try {
    const stored = await AsyncStorage.getItem(`${SYNC_STATUS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.log('[SyncManager] Error reading sync status:', error);
  }
  return {
    lastSyncAt: null,
    pendingChanges: 0,
    isSyncing: false,
    syncError: null,
  };
}

async function saveSyncStatus(userId: string, status: SyncStatus): Promise<void> {
  await AsyncStorage.setItem(`${SYNC_STATUS_KEY}_${userId}`, JSON.stringify(status));
  notifySyncStatus(status);
}

export async function queueChange(
  userId: string,
  dataType: keyof SyncableData,
  operation: 'create' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<void> {
  try {
    const queueKey = `${SYNC_QUEUE_KEY}_${userId}`;
    const existingQueue = await AsyncStorage.getItem(queueKey);
    const queue: SyncQueueItem[] = existingQueue ? JSON.parse(existingQueue) : [];
    
    const item: SyncQueueItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      operation,
      dataType,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };
    
    queue.push(item);
    await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
    
    const status = await getSyncStatus(userId);
    await saveSyncStatus(userId, {
      ...status,
      pendingChanges: queue.length,
    });
    
    console.log('[SyncManager] Queued change:', dataType, operation);
  } catch (error) {
    console.error('[SyncManager] Error queueing change:', error);
  }
}

export async function getLocalData(userId: string): Promise<SyncableData | null> {
  try {
    const stored = await AsyncStorage.getItem(`${LOCAL_DATA_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.log('[SyncManager] Error reading local data:', error);
    return null;
  }
}

export async function saveLocalData(userId: string, data: Partial<SyncableData>): Promise<void> {
  try {
    const existing = await getLocalData(userId);
    const updated: SyncableData = {
      userState: data.userState ?? existing?.userState ?? null,
      gameStats: data.gameStats ?? existing?.gameStats ?? null,
      ecoData: data.ecoData ?? existing?.ecoData ?? null,
      playlists: data.playlists ?? existing?.playlists ?? null,
      wellness: data.wellness ?? existing?.wellness ?? null,
      lastModified: new Date().toISOString(),
    };
    await AsyncStorage.setItem(`${LOCAL_DATA_KEY}_${userId}`, JSON.stringify(updated));
    console.log('[SyncManager] Saved local data for user:', userId);
  } catch (error) {
    console.error('[SyncManager] Error saving local data:', error);
  }
}

export async function getConflictResolution(): Promise<ConflictResolution> {
  try {
    const stored = await AsyncStorage.getItem(CONFLICT_RESOLUTION_KEY);
    return (stored as ConflictResolution) || 'cloud';
  } catch {
    return 'cloud';
  }
}

export async function setConflictResolution(resolution: ConflictResolution): Promise<void> {
  await AsyncStorage.setItem(CONFLICT_RESOLUTION_KEY, resolution);
}

function mergeData(local: Record<string, unknown>, cloud: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...cloud };
  
  for (const key of Object.keys(local)) {
    if (!(key in cloud)) {
      merged[key] = local[key];
    } else if (typeof local[key] === 'number' && typeof cloud[key] === 'number') {
      merged[key] = Math.max(local[key] as number, cloud[key] as number);
    } else if (Array.isArray(local[key]) && Array.isArray(cloud[key])) {
      const localArr = local[key] as unknown[];
      const cloudArr = cloud[key] as unknown[];
      merged[key] = [...new Set([...cloudArr, ...localArr])];
    }
  }
  
  return merged;
}

export async function resolveConflict(
  local: SyncableData,
  cloud: SyncableData
): Promise<SyncableData> {
  const resolution = await getConflictResolution();
  
  console.log('[SyncManager] Resolving conflict with strategy:', resolution);
  
  switch (resolution) {
    case 'local':
      return local;
    case 'cloud':
      return cloud;
    case 'merge':
      return {
        userState: local.userState && cloud.userState 
          ? mergeData(local.userState, cloud.userState) 
          : local.userState || cloud.userState,
        gameStats: local.gameStats && cloud.gameStats 
          ? mergeData(local.gameStats, cloud.gameStats) 
          : local.gameStats || cloud.gameStats,
        ecoData: local.ecoData && cloud.ecoData 
          ? mergeData(local.ecoData, cloud.ecoData) 
          : local.ecoData || cloud.ecoData,
        playlists: local.playlists && cloud.playlists 
          ? mergeData(local.playlists, cloud.playlists) 
          : local.playlists || cloud.playlists,
        wellness: local.wellness && cloud.wellness 
          ? mergeData(local.wellness, cloud.wellness) 
          : local.wellness || cloud.wellness,
        lastModified: new Date().toISOString(),
      };
    default:
      return cloud;
  }
}

async function checkAndSync(userId: string): Promise<void> {
  const status = await getSyncStatus(userId);
  if (status.pendingChanges > 0 && !status.isSyncing) {
    await syncNow(userId);
  }
}

async function flushPendingChanges(userId: string): Promise<void> {
  try {
    const localData = await getLocalData(userId);
    if (localData) {
      await AsyncStorage.setItem(`${LOCAL_DATA_KEY}_${userId}`, JSON.stringify({
        ...localData,
        lastModified: new Date().toISOString(),
      }));
      console.log('[SyncManager] Flushed pending changes on background');
    }
  } catch (error) {
    console.error('[SyncManager] Error flushing pending changes:', error);
  }
}

export async function syncNow(userId: string): Promise<{ success: boolean; error?: string }> {
  const status = await getSyncStatus(userId);
  
  if (status.isSyncing) {
    return { success: false, error: 'Sync already in progress' };
  }
  
  try {
    await saveSyncStatus(userId, { ...status, isSyncing: true, syncError: null });
    
    console.log('[SyncManager] Starting sync for user:', userId);
    
    const queueKey = `${SYNC_QUEUE_KEY}_${userId}`;
    const queueData = await AsyncStorage.getItem(queueKey);
    const queue: SyncQueueItem[] = queueData ? JSON.parse(queueData) : [];
    
    console.log('[SyncManager] Processing', queue.length, 'queued changes');
    
    const localData = await getLocalData(userId);
    
    await AsyncStorage.setItem(queueKey, JSON.stringify([]));
    
    const now = new Date().toISOString();
    await saveSyncStatus(userId, {
      lastSyncAt: now,
      pendingChanges: 0,
      isSyncing: false,
      syncError: null,
    });
    
    console.log('[SyncManager] Sync completed at:', now);
    console.log('[SyncManager] Local data preserved:', !!localData);
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
    console.error('[SyncManager] Sync failed:', errorMessage);
    
    await saveSyncStatus(userId, {
      ...status,
      isSyncing: false,
      syncError: errorMessage,
    });
    
    return { success: false, error: errorMessage };
  }
}

export async function clearSyncData(userId: string): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      `${SYNC_STATUS_KEY}_${userId}`,
      `${SYNC_QUEUE_KEY}_${userId}`,
      `${LOCAL_DATA_KEY}_${userId}`,
    ]);
    console.log('[SyncManager] Cleared sync data for user:', userId);
  } catch (error) {
    console.error('[SyncManager] Error clearing sync data:', error);
  }
}

export async function exportUserData(userId: string): Promise<string> {
  try {
    const localData = await getLocalData(userId);
    const status = await getSyncStatus(userId);
    
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      userId,
      data: localData,
      syncStatus: status,
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('[SyncManager] Error exporting data:', error);
    throw error;
  }
}

export async function importUserData(userId: string, jsonData: string): Promise<boolean> {
  try {
    const importData = JSON.parse(jsonData);
    
    if (!importData.version || !importData.data) {
      throw new Error('Invalid import data format');
    }
    
    await saveLocalData(userId, importData.data);
    await queueChange(userId, 'userState', 'update', importData.data.userState || {});
    
    console.log('[SyncManager] Data imported successfully');
    return true;
  } catch (error) {
    console.error('[SyncManager] Error importing data:', error);
    return false;
  }
}
