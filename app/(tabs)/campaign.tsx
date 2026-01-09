import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Map, 
  Star, 
  Lock, 
  ChevronRight, 
  X, 
  Trophy,
  Coins,
  Sparkles,
  RotateCcw,
  Home,
  Volume2,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { CampaignProvider, useCampaign } from '@/contexts/CampaignContext';
import { CAMPAIGN_WORLDS } from '@/constants/campaign';
import { useInstrument } from '@/contexts/InstrumentContext';
import { useAudio } from '@/hooks/useAudio';
import InstrumentSelector from '@/components/InstrumentSelector';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const NOTE_SCALE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function CampaignContent() {
  const {
    stats,
    gameState,
    currentPuzzle,
    currentGuess,
    worlds,
    isLoading,
    startPuzzle,
    addNote,
    removeNote,
    submitGuess,
    exitPuzzle,
    retryPuzzle,
    getPuzzleProgress,
    getWorldProgress,
    showStory,
    setShowStory,
    storyText,
    showReward,
    setShowReward,
  } = useCampaign();

  const { currentInstrument } = useInstrument();
  const { playNote, playMelody, playbackState } = useAudio(currentInstrument.id);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);

  const handleNotePress = useCallback((note: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    playNote(note);
    addNote(note);
  }, [playNote, addNote]);

  const handlePlayMelody = useCallback(() => {
    if (currentPuzzle) {
      playMelody(currentPuzzle.notes);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [currentPuzzle, playMelody]);

  const handleSubmit = useCallback(() => {
    if (currentPuzzle && currentGuess.length === currentPuzzle.notes.length) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      submitGuess();
    }
  }, [currentPuzzle, currentGuess.length, submitGuess]);

  const handleRemoveNote = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeNote();
  }, [removeNote]);

  const renderStars = (earned: number, max: number = 3) => {
    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={14}
            color={i < earned ? '#FBBF24' : Colors.textMuted}
            fill={i < earned ? '#FBBF24' : 'transparent'}
          />
        ))}
      </View>
    );
  };

  const renderGuessGrid = () => {
    if (!currentPuzzle) return null;
    
    const rows = [];
    for (let i = 0; i < currentPuzzle.maxGuesses; i++) {
      const guess = gameState.guesses[i];
      const isCurrentRow = i === gameState.guesses.length && gameState.gameStatus === 'playing';

      rows.push(
        <View key={i} style={styles.guessRow}>
          {Array.from({ length: currentPuzzle.notes.length }).map((_, j) => {
            let cellContent = '';
            let cellStyle = styles.guessCell;

            if (guess) {
              cellContent = guess[j]?.note ?? '';
              const feedback = guess[j]?.feedback;
              cellStyle = [
                styles.guessCell,
                feedback === 'correct' ? styles.correctCell : 
                feedback === 'present' ? styles.presentCell : 
                styles.absentCell,
              ] as any;
            } else if (isCurrentRow && currentGuess[j]) {
              cellContent = currentGuess[j];
              cellStyle = [styles.guessCell, styles.activeCell] as any;
            }

            return (
              <View key={j} style={cellStyle}>
                <Text style={styles.guessCellText}>{cellContent}</Text>
              </View>
            );
          })}
        </View>
      );
    }
    return rows;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading adventure...</Text>
      </View>
    );
  }

  if (currentPuzzle) {
    return (
      <LinearGradient colors={['#1F1B24', '#2D2438', '#3D2C4A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.puzzleHeader}>
            <TouchableOpacity onPress={exitPuzzle} style={styles.backButton}>
              <Home size={20} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.puzzleTitleContainer}>
              <Text style={styles.puzzleTitle}>{currentPuzzle.name}</Text>
              <Text style={styles.puzzleDifficulty}>
                {currentPuzzle.difficulty.toUpperCase()}
              </Text>
            </View>
            <View style={styles.puzzleHeaderRight}>
              <InstrumentSelector compact />
              <View style={styles.puzzleRewards}>
                <Coins size={16} color="#FBBF24" />
                <Text style={styles.rewardText}>{currentPuzzle.rewards.coins}</Text>
              </View>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.puzzleContent}>
            {currentPuzzle.storyText && (
              <View style={styles.storyBubble}>
                <Text style={styles.storyBubbleText}>{currentPuzzle.storyText}</Text>
              </View>
            )}

            <Text style={styles.puzzleHint}>{currentPuzzle.hint}</Text>

            <View style={styles.guessGrid}>{renderGuessGrid()}</View>

            {gameState.gameStatus === 'won' && (
              <View style={styles.resultContainer}>
                <Text style={styles.wonText}>🎉 Puzzle Complete!</Text>
                {renderStars(gameState.starsEarned)}
                <TouchableOpacity
                  style={styles.playMelodyButton}
                  onPress={handlePlayMelody}
                  disabled={playbackState.isPlaying}
                >
                  <Volume2 size={18} color={Colors.text} />
                  <Text style={styles.playMelodyText}>
                    {playbackState.isPlaying ? 'Playing...' : 'Play Melody'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState.gameStatus === 'lost' && (
              <View style={styles.resultContainer}>
                <Text style={styles.lostText}>Not quite...</Text>
                <Text style={styles.solutionText}>
                  The melody was: {currentPuzzle.notes.join(' - ')}
                </Text>
                <TouchableOpacity
                  style={styles.playMelodyButton}
                  onPress={handlePlayMelody}
                  disabled={playbackState.isPlaying}
                >
                  <Volume2 size={18} color={Colors.text} />
                  <Text style={styles.playMelodyText}>
                    {playbackState.isPlaying ? 'Playing...' : 'Hear the Melody'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {gameState.gameStatus === 'playing' && (
              <View style={styles.keyboardSection}>
                <View style={styles.pianoContainer}>
                  <View style={styles.pianoRow}>
                    {NOTE_SCALE.slice(0, 6).map((note) => (
                      <TouchableOpacity
                        key={note}
                        style={[
                          styles.pianoKey,
                          note.includes('#') && styles.sharpKey,
                        ]}
                        onPress={() => handleNotePress(note)}
                      >
                        <Text style={[
                          styles.pianoKeyText,
                          note.includes('#') && styles.sharpKeyText,
                        ]}>{note}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pianoRow}>
                    {NOTE_SCALE.slice(6).map((note) => (
                      <TouchableOpacity
                        key={note}
                        style={[
                          styles.pianoKey,
                          note.includes('#') && styles.sharpKey,
                        ]}
                        onPress={() => handleNotePress(note)}
                      >
                        <Text style={[
                          styles.pianoKeyText,
                          note.includes('#') && styles.sharpKeyText,
                        ]}>{note}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleRemoveNote}>
                    <Text style={styles.actionBtnText}>⌫</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      currentGuess.length === currentPuzzle.notes.length && styles.submitBtnActive,
                    ]}
                    onPress={handleSubmit}
                    disabled={currentGuess.length !== currentPuzzle.notes.length}
                  >
                    <Text style={[
                      styles.submitBtnText,
                      currentGuess.length === currentPuzzle.notes.length && styles.submitBtnTextActive,
                    ]}>Submit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {gameState.gameStatus !== 'playing' && (
              <View style={styles.endButtons}>
                <TouchableOpacity style={styles.retryButton} onPress={retryPuzzle}>
                  <RotateCcw size={18} color={Colors.text} />
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueButton} onPress={exitPuzzle}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const activeWorld = selectedWorld 
    ? CAMPAIGN_WORLDS.find(w => w.id === selectedWorld)
    : null;

  return (
    <LinearGradient colors={['#1F1B24', '#2D2438', '#3D2C4A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Map size={28} color="#A78BFA" />
              <Text style={styles.title}>Melody Quest</Text>
            </View>
            <Text style={styles.subtitle}>Embark on a musical adventure</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Star size={20} color="#FBBF24" />
              <Text style={styles.statValue}>{stats.totalStars}</Text>
              <Text style={styles.statLabel}>Stars</Text>
            </View>
            <View style={styles.statCard}>
              <Coins size={20} color="#22C55E" />
              <Text style={styles.statValue}>{stats.totalCoins}</Text>
              <Text style={styles.statLabel}>Coins</Text>
            </View>
            <View style={styles.statCard}>
              <Sparkles size={20} color="#A78BFA" />
              <Text style={styles.statValue}>{stats.totalXp}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
          </View>

          <View style={styles.worldsSection}>
            <Text style={styles.sectionTitle}>Worlds</Text>
            {worlds.map((world) => {
              const progress = getWorldProgress(world.id);
              const isUnlocked = world.isUnlocked;

              return (
                <TouchableOpacity
                  key={world.id}
                  style={[styles.worldCard, !isUnlocked && styles.worldLocked]}
                  onPress={() => isUnlocked && setSelectedWorld(world.id)}
                  disabled={!isUnlocked}
                >
                  <LinearGradient
                    colors={isUnlocked ? world.backgroundGradient as [string, string] : ['#374151', '#1F2937']}
                    style={styles.worldGradient}
                  >
                    <View style={styles.worldHeader}>
                      <Text style={styles.worldIcon}>{world.icon}</Text>
                      <View style={styles.worldInfo}>
                        <Text style={styles.worldName}>{world.name}</Text>
                        <Text style={styles.worldDesc}>{world.description}</Text>
                      </View>
                      {isUnlocked ? (
                        <ChevronRight size={24} color={Colors.text} />
                      ) : (
                        <View style={styles.lockContainer}>
                          <Lock size={18} color={Colors.textMuted} />
                          <Text style={styles.lockText}>{world.unlockRequirement}⭐</Text>
                        </View>
                      )}
                    </View>

                    {isUnlocked && (
                      <View style={styles.worldProgress}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill, 
                              { width: `${(progress.completed / progress.total) * 100}%` }
                            ]} 
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {progress.completed}/{progress.total} • {renderStars(progress.stars, progress.maxStars)}
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>

          {stats.badges.length > 0 && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Badges Earned</Text>
              <View style={styles.badgesList}>
                {stats.badges.map((badge) => (
                  <View key={badge} style={styles.badgeItem}>
                    <Trophy size={24} color="#FBBF24" />
                    <Text style={styles.badgeName}>{badge.replace('_', ' ')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <Modal visible={!!selectedWorld} animationType="slide" transparent>
          <View style={styles.chapterModalOverlay}>
            <View style={styles.chapterModalContent}>
              <View style={styles.chapterHeader}>
                <TouchableOpacity onPress={() => setSelectedWorld(null)}>
                  <X size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.chapterTitle}>
                  {activeWorld?.icon} {activeWorld?.name}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {activeWorld?.chapters.map((chapter, chapterIndex) => (
                  <View key={chapter.id} style={styles.chapterSection}>
                    <View style={styles.chapterTitleRow}>
                      <Text style={styles.chapterName}>
                        {chapter.isBoss ? '👑 ' : ''}{chapter.name}
                      </Text>
                      {chapter.isBoss && (
                        <View style={styles.bossBadge}>
                          <Text style={styles.bossBadgeText}>BOSS</Text>
                        </View>
                      )}
                    </View>

                    {chapter.puzzles.map((puzzle, puzzleIndex) => {
                      const progress = getPuzzleProgress(puzzle.id);
                      const prevPuzzle = puzzleIndex > 0 ? chapter.puzzles[puzzleIndex - 1] : null;
                      const prevChapter = chapterIndex > 0 ? activeWorld.chapters[chapterIndex - 1] : null;
                      
                      const isPrevCompleted = prevPuzzle 
                        ? getPuzzleProgress(prevPuzzle.id)?.completed
                        : prevChapter
                        ? prevChapter.puzzles.every(p => getPuzzleProgress(p.id)?.completed)
                        : true;

                      const isLocked = !isPrevCompleted && !progress?.completed;

                      return (
                        <TouchableOpacity
                          key={puzzle.id}
                          style={[styles.puzzleCard, isLocked && styles.puzzleCardLocked]}
                          onPress={() => {
                            if (!isLocked) {
                              setSelectedWorld(null);
                              startPuzzle(puzzle);
                            }
                          }}
                          disabled={isLocked}
                        >
                          <View style={styles.puzzleInfo}>
                            <Text style={[styles.puzzleName, isLocked && styles.puzzleNameLocked]}>
                              {puzzle.name}
                            </Text>
                            <Text style={styles.puzzleMeta}>
                              {puzzle.difficulty} • {puzzle.notes.length} notes
                            </Text>
                          </View>

                          {progress?.completed ? (
                            renderStars(progress.starsEarned)
                          ) : isLocked ? (
                            <Lock size={18} color={Colors.textMuted} />
                          ) : (
                            <ChevronRight size={18} color={Colors.textSecondary} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal visible={showStory} animationType="fade" transparent>
          <View style={styles.storyModalOverlay}>
            <View style={styles.storyModalContent}>
              <Text style={styles.storyModalText}>{storyText}</Text>
              <TouchableOpacity
                style={styles.storyModalButton}
                onPress={() => setShowStory(false)}
              >
                <Text style={styles.storyModalButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={showReward} animationType="fade" transparent>
          <View style={styles.rewardModalOverlay}>
            <View style={styles.rewardModalContent}>
              <Sparkles size={48} color="#FBBF24" />
              <Text style={styles.rewardModalTitle}>Rewards!</Text>
              {gameState.starsEarned > 0 && (
                <>
                  <View style={styles.rewardRow}>
                    <Coins size={20} color="#22C55E" />
                    <Text style={styles.rewardValue}>+{gameState.starsEarned * 50} coins</Text>
                  </View>
                  <View style={styles.rewardRow}>
                    <Sparkles size={20} color="#A78BFA" />
                    <Text style={styles.rewardValue}>+{gameState.starsEarned * 100} XP</Text>
                  </View>
                  {renderStars(gameState.starsEarned)}
                </>
              )}
              <TouchableOpacity
                style={styles.rewardModalButton}
                onPress={() => setShowReward(false)}
              >
                <Text style={styles.rewardModalButtonText}>Collect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function CampaignScreen() {
  return (
    <CampaignProvider>
      <CampaignContent />
    </CampaignProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F1B24',
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  worldsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  worldCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  worldLocked: {
    opacity: 0.6,
  },
  worldGradient: {
    padding: 20,
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  worldIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  worldInfo: {
    flex: 1,
  },
  worldName: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  worldDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  lockContainer: {
    alignItems: 'center',
  },
  lockText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  worldProgress: {
    marginTop: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#A78BFA',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  badgesSection: {
    padding: 20,
    paddingBottom: 100,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  badgeName: {
    fontSize: 14,
    color: Colors.text,
    textTransform: 'capitalize' as const,
  },
  chapterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  chapterModalContent: {
    flex: 1,
    backgroundColor: '#1F1B24',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  chapterSection: {
    marginBottom: 24,
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  chapterName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  bossBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bossBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  puzzleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  puzzleCardLocked: {
    opacity: 0.5,
  },
  puzzleInfo: {
    flex: 1,
  },
  puzzleName: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  puzzleNameLocked: {
    color: Colors.textMuted,
  },
  puzzleMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textTransform: 'capitalize' as const,
  },
  storyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyModalContent: {
    width: width - 60,
    backgroundColor: '#2D2438',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  storyModalText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 20,
  },
  storyModalButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  storyModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rewardModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardModalContent: {
    width: width - 60,
    backgroundColor: '#2D2438',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  rewardModalTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FBBF24',
    marginTop: 16,
    marginBottom: 24,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rewardModalButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 20,
    marginTop: 24,
  },
  rewardModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  puzzleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  puzzleTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  puzzleTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  puzzleDifficulty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  puzzleHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  puzzleRewards: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FBBF24',
  },
  puzzleContent: {
    padding: 20,
    paddingBottom: 100,
  },
  storyBubble: {
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  storyBubbleText: {
    fontSize: 14,
    color: Colors.text,
    fontStyle: 'italic' as const,
    lineHeight: 22,
  },
  puzzleHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center' as const,
  },
  guessGrid: {
    gap: 8,
    marginBottom: 24,
  },
  guessRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  guessCell: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  activeCell: {
    borderColor: '#A78BFA',
    backgroundColor: 'rgba(167,139,250,0.1)',
  },
  correctCell: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  presentCell: {
    backgroundColor: '#EAB308',
    borderColor: '#EAB308',
  },
  absentCell: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  guessCellText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600' as const,
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  wonText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#22C55E',
    marginBottom: 12,
  },
  lostText: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  solutionText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  playMelodyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#A78BFA',
  },
  playMelodyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  keyboardSection: {
    marginTop: 20,
  },
  pianoContainer: {
    gap: 8,
    marginBottom: 16,
  },
  pianoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 6,
  },
  pianoKey: {
    width: 46,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  sharpKey: {
    backgroundColor: '#1F2937',
    width: 42,
    height: 48,
  },
  pianoKeyText: {
    color: '#1F1B24',
    fontSize: 13,
    fontWeight: '700' as const,
  },
  sharpKeyText: {
    color: Colors.text,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionBtnText: {
    color: Colors.text,
    fontSize: 20,
  },
  submitBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnActive: {
    backgroundColor: '#A78BFA',
  },
  submitBtnText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  submitBtnTextActive: {
    color: '#1F1B24',
  },
  endButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  continueButton: {
    backgroundColor: '#A78BFA',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
  },
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
