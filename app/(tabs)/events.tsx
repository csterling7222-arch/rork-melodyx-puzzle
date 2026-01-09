import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Calendar, Gift, Clock, Check, Lock, Play, ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useEvents } from '@/contexts/EventsContext';
import { ThemeEvent } from '@/constants/events';

function EventCard({ 
  event, 
  isActive,
  progress,
  onStart,
}: { 
  event: ThemeEvent;
  isActive: boolean;
  progress: { completed: number; total: number; rewardsClaimed: number } | null;
  onStart: () => void;
}) {
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const now = new Date();
  const isUpcoming = startDate > now;
  const isCompleted = progress && progress.completed === progress.total;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={[
      styles.eventCard, 
      { backgroundColor: isActive ? event.backgroundColor : Colors.surface },
      isActive && { borderColor: event.accentColor, borderWidth: 2 }
    ]}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventIcon}>{event.icon}</Text>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventDates}>
            {formatDate(startDate)} - {formatDate(endDate)}
          </Text>
        </View>
        {isActive && (
          <View style={[styles.liveBadge, { backgroundColor: event.accentColor }]}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
        {isUpcoming && (
          <View style={styles.upcomingBadge}>
            <Clock size={12} color={Colors.textMuted} />
            <Text style={styles.upcomingText}>Soon</Text>
          </View>
        )}
      </View>

      <Text style={styles.eventDesc}>{event.description}</Text>

      {progress && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(progress.completed / progress.total) * 100}%`,
                  backgroundColor: event.accentColor,
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {progress.completed}/{progress.total} puzzles
          </Text>
        </View>
      )}

      <View style={styles.rewardsRow}>
        {event.rewards.slice(0, 3).map((reward, index) => {
          const isUnlocked = progress && progress.completed >= reward.requirement;
          const isClaimed = progress && progress.rewardsClaimed > index;
          
          return (
            <View 
              key={reward.id} 
              style={[
                styles.rewardItem,
                isUnlocked && styles.rewardUnlocked,
                isClaimed && styles.rewardClaimed,
              ]}
            >
              <Text style={styles.rewardIcon}>{reward.icon}</Text>
              {!isUnlocked && (
                <View style={styles.rewardLock}>
                  <Lock size={10} color={Colors.textMuted} />
                </View>
              )}
              {isClaimed && (
                <View style={styles.rewardCheck}>
                  <Check size={10} color={Colors.correct} />
                </View>
              )}
            </View>
          );
        })}
      </View>

      {isActive && !isCompleted && (
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: event.accentColor }]}
          onPress={onStart}
        >
          <Play size={18} color="#000" fill="#000" />
          <Text style={styles.playButtonText}>
            {progress ? 'Continue' : 'Start Event'}
          </Text>
        </TouchableOpacity>
      )}

      {isCompleted && (
        <View style={styles.completedBadge}>
          <Check size={18} color={Colors.correct} />
          <Text style={styles.completedText}>Completed!</Text>
        </View>
      )}
    </View>
  );
}

export default function EventsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    activeEvent, 
    upcomingEvents, 
    allEvents,
    getEventProgress,
    startEvent,
  } = useEvents();

  const handleStartEvent = useCallback((eventId: string) => {
    startEvent(eventId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [startEvent]);

  const getProgress = (eventId: string) => {
    const progress = getEventProgress(eventId);
    if (!progress) return null;
    
    const event = allEvents.find(e => e.id === eventId);
    if (!event) return null;
    
    return {
      completed: progress.puzzlesCompleted,
      total: event.songs.length,
      rewardsClaimed: progress.rewardsClaimed.length,
    };
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Limited-time challenges & rewards</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeEvent ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Active Event</Text>
            </View>
            <EventCard
              event={activeEvent}
              isActive={true}
              progress={getProgress(activeEvent.id)}
              onStart={() => handleStartEvent(activeEvent.id)}
            />
          </View>
        ) : (
          <View style={styles.noActiveEvent}>
            <Calendar size={48} color={Colors.textMuted} />
            <Text style={styles.noEventTitle}>No Active Event</Text>
            <Text style={styles.noEventText}>
              Check back soon for the next themed challenge!
            </Text>
          </View>
        )}

        {upcomingEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={20} color={Colors.present} />
              <Text style={styles.sectionTitle}>Coming Soon</Text>
            </View>
            {upcomingEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isActive={false}
                progress={null}
                onStart={() => {}}
              />
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Gift size={20} color={Colors.correct} />
            <Text style={styles.sectionTitle}>All Events</Text>
          </View>
          <View style={styles.allEventsList}>
            {allEvents.map(event => {
              const progress = getProgress(event.id);
              const isCompleted = progress && progress.completed === progress.total;
              
              return (
                <View key={event.id} style={styles.eventListItem}>
                  <Text style={styles.eventListIcon}>{event.icon}</Text>
                  <View style={styles.eventListInfo}>
                    <Text style={styles.eventListName}>{event.name}</Text>
                    <Text style={styles.eventListDate}>
                      {new Date(event.startDate).toLocaleDateString()}
                    </Text>
                  </View>
                  {isCompleted && (
                    <View style={styles.completedMini}>
                      <Check size={14} color={Colors.correct} />
                    </View>
                  )}
                  <ChevronRight size={18} color={Colors.textMuted} />
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  noActiveEvent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  noEventTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
  },
  noEventText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  eventCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  eventDates: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  liveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#000',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  eventDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rewardItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  rewardUnlocked: {
    opacity: 1,
    backgroundColor: Colors.surface,
  },
  rewardClaimed: {
    borderWidth: 2,
    borderColor: Colors.correct,
  },
  rewardIcon: {
    fontSize: 22,
  },
  rewardLock: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 2,
  },
  rewardCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.correct + '30',
    borderRadius: 8,
    padding: 2,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.correct + '20',
    paddingVertical: 12,
    borderRadius: 14,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
  allEventsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceLight,
  },
  eventListIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  eventListInfo: {
    flex: 1,
  },
  eventListName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  eventListDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  completedMini: {
    marginRight: 8,
  },
});
