import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Activity, X, ChevronUp, ChevronDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { 
  glitchFreeEngine, 
  getCurrentFPS,
  getGlitchDiagnostics,
} from '@/utils/glitchFreeEngine';

interface PerformanceMonitorProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
  onToggle?: () => void;
}

interface PerformanceStats {
  fps: number;
  avgFps: number;
  memoryWarnings: number;
  crashCount: number;
  networkQuality: string;
  performanceLevel: string;
  eventCount: number;
}

function PerformanceMonitorComponent({ 
  visible = __DEV__, 
  position = 'top-right',
  compact = true,
  onToggle,
}: PerformanceMonitorProps) {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    avgFps: 60,
    memoryWarnings: 0,
    crashCount: 0,
    networkQuality: 'good',
    performanceLevel: 'high',
    eventCount: 0,
  });
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, fadeAnim]);

  useEffect(() => {
    if (!visible) return;

    const updateStats = () => {
      const diagnostics = getGlitchDiagnostics();
      
      setStats({
        fps: getCurrentFPS(),
        avgFps: glitchFreeEngine.getAverageFPS(),
        memoryWarnings: diagnostics.memoryWarnings,
        crashCount: diagnostics.crashCount,
        networkQuality: diagnostics.deviceCapabilities.networkQuality,
        performanceLevel: diagnostics.deviceCapabilities.performanceLevel,
        eventCount: diagnostics.events.length,
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  const getFPSColor = useCallback((fps: number): string => {
    if (fps >= 55) return Colors.correct;
    if (fps >= 40) return '#FFD700';
    if (fps >= 25) return '#FFA500';
    return '#EF4444';
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
    onToggle?.();
  }, [onToggle]);

  if (!visible) return null;

  const positionStyle = {
    'top-left': { top: Platform.OS === 'ios' ? 50 : 10, left: 10 },
    'top-right': { top: Platform.OS === 'ios' ? 50 : 10, right: 10 },
    'bottom-left': { bottom: Platform.OS === 'ios' ? 90 : 70, left: 10 },
    'bottom-right': { bottom: Platform.OS === 'ios' ? 90 : 70, right: 10 },
  }[position];

  if (isMinimized) {
    return (
      <Animated.View 
        style={[
          styles.minimizedContainer,
          positionStyle,
          { opacity: fadeAnim },
        ]}
      >
        <TouchableOpacity 
          style={styles.minimizedButton}
          onPress={handleMinimize}
          activeOpacity={0.8}
        >
          <Activity size={16} color={getFPSColor(stats.fps)} />
          <Text style={[styles.minimizedFps, { color: getFPSColor(stats.fps) }]}>
            {stats.fps}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container,
        positionStyle,
        { 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerLeft}
          onPress={handleToggleExpand}
          activeOpacity={0.7}
        >
          <Activity size={14} color={getFPSColor(stats.fps)} />
          <Text style={styles.headerTitle}>Performance</Text>
          {isExpanded ? (
            <ChevronUp size={12} color={Colors.textSecondary} />
          ) : (
            <ChevronDown size={12} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleMinimize}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={12} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.fpsRow}>
        <View style={styles.fpsItem}>
          <Text style={[styles.fpsValue, { color: getFPSColor(stats.fps) }]}>
            {stats.fps}
          </Text>
          <Text style={styles.fpsLabel}>FPS</Text>
        </View>
        <View style={styles.fpsDivider} />
        <View style={styles.fpsItem}>
          <Text style={[styles.fpsValue, { color: getFPSColor(stats.avgFps) }]}>
            {Math.round(stats.avgFps)}
          </Text>
          <Text style={styles.fpsLabel}>Avg</Text>
        </View>
      </View>

      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Performance</Text>
            <Text style={[styles.statValue, styles.capitalize]}>
              {stats.performanceLevel}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Network</Text>
            <Text style={[styles.statValue, styles.capitalize]}>
              {stats.networkQuality}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Events</Text>
            <Text style={styles.statValue}>{stats.eventCount}</Text>
          </View>
          {stats.crashCount > 0 && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Crashes</Text>
              <Text style={[styles.statValue, styles.errorText]}>
                {stats.crashCount}
              </Text>
            </View>
          )}
          {stats.memoryWarnings > 0 && (
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Mem Warnings</Text>
              <Text style={[styles.statValue, styles.warningText]}>
                {stats.memoryWarnings}
              </Text>
            </View>
          )}
        </View>
      )}
    </Animated.View>
  );
}

export const PerformanceMonitor = memo(PerformanceMonitorComponent);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 10,
    padding: 8,
    minWidth: 100,
    zIndex: 9999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  minimizedContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  minimizedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  minimizedFps: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 2,
  },
  fpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fpsItem: {
    alignItems: 'center',
  },
  fpsValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  fpsLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  fpsDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '500' as const,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  errorText: {
    color: '#EF4444',
  },
  warningText: {
    color: '#FFD700',
  },
});
