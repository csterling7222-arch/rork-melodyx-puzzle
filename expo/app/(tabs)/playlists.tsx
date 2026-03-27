import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ListMusic, Plus, Music, Trash2, Share2,
  X, Check, Sparkles, ChevronRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { usePlaylist, Playlist, PlaylistMelody } from '@/contexts/PlaylistContext';

function MelodyChip({ melody, onRemove }: { melody: PlaylistMelody; onRemove?: () => void }) {
  return (
    <View style={styles.melodyChip}>
      <Text style={styles.melodyChipText}>{melody.name}</Text>
      <Text style={styles.melodyChipNotes}>{melody.notes.length} notes</Text>
      {onRemove && (
        <TouchableOpacity onPress={onRemove} style={styles.melodyChipRemove}>
          <X size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PlaylistCard({ 
  playlist, 
  onPress, 
  onDelete 
}: { 
  playlist: Playlist; 
  onPress: () => void;
  onDelete: () => void;
}) {
  const handleDelete = useCallback(() => {
    if (Platform.OS === 'web') {
      if (confirm('Delete this playlist?')) {
        onDelete();
      }
    } else {
      Alert.alert(
        'Delete Playlist',
        'Are you sure you want to delete this playlist?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: onDelete },
        ]
      );
    }
  }, [onDelete]);

  return (
    <TouchableOpacity style={styles.playlistCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.playlistIcon}>
        <ListMusic size={24} color={Colors.accent} />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        <Text style={styles.playlistMeta}>
          {playlist.melodies.length} melodies • {playlist.isPublic ? 'Public' : 'Private'}
        </Text>
        {playlist.description && (
          <Text style={styles.playlistDesc} numberOfLines={1}>{playlist.description}</Text>
        )}
      </View>
      <View style={styles.playlistActions}>
        <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
          <Trash2 size={18} color={Colors.textMuted} />
        </TouchableOpacity>
        <ChevronRight size={20} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function SolvedMelodyItem({ 
  melody, 
  onAdd, 
  isInPlaylist 
}: { 
  melody: PlaylistMelody; 
  onAdd: () => void;
  isInPlaylist: boolean;
}) {
  return (
    <View style={styles.solvedMelodyItem}>
      <View style={styles.solvedMelodyIcon}>
        <Music size={18} color={Colors.accent} />
      </View>
      <View style={styles.solvedMelodyInfo}>
        <Text style={styles.solvedMelodyName}>{melody.name}</Text>
        <Text style={styles.solvedMelodyNotes}>{melody.notes.join(' → ')}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.addBtn, isInPlaylist && styles.addBtnDisabled]}
        onPress={onAdd}
        disabled={isInPlaylist}
      >
        {isInPlaylist ? (
          <Check size={16} color={Colors.correct} />
        ) : (
          <Plus size={16} color={Colors.text} />
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function PlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const {
    playlists,
    solvedMelodies,
    selectedPlaylist,
    setSelectedPlaylist,
    createPlaylist,
    addMelodyToPlaylist,
    removeMelodyFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    generateRemix,
  } = usePlaylist();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddMelodiesModal, setShowAddMelodiesModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isGeneratingRemix, setIsGeneratingRemix] = useState(false);

  const handleCreatePlaylist = useCallback(() => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [newPlaylistName, newPlaylistDesc, createPlaylist]);

  const handleOpenPlaylist = useCallback((playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setShowDetailModal(true);
  }, [setSelectedPlaylist]);

  const handleDeletePlaylist = useCallback((playlistId: string) => {
    deletePlaylist(playlistId);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [deletePlaylist]);

  const handleAddMelody = useCallback((melodyId: string) => {
    if (!selectedPlaylist) return;
    addMelodyToPlaylist(selectedPlaylist.id, melodyId);
    const updated = playlists.find(p => p.id === selectedPlaylist.id);
    if (updated) setSelectedPlaylist(updated);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [selectedPlaylist, addMelodyToPlaylist, playlists, setSelectedPlaylist]);

  const handleRemoveMelody = useCallback((melodyId: string) => {
    if (!selectedPlaylist) return;
    removeMelodyFromPlaylist(selectedPlaylist.id, melodyId);
    const updated = playlists.find(p => p.id === selectedPlaylist.id);
    if (updated) setSelectedPlaylist(updated);
  }, [selectedPlaylist, removeMelodyFromPlaylist, playlists, setSelectedPlaylist]);

  const handleGenerateRemix = useCallback(async () => {
    if (!selectedPlaylist) return;
    setIsGeneratingRemix(true);
    try {
      await generateRemix(selectedPlaylist.id);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsGeneratingRemix(false);
    }
  }, [selectedPlaylist, generateRemix]);

  const handleTogglePublic = useCallback(() => {
    if (!selectedPlaylist) return;
    updatePlaylist(selectedPlaylist.id, { isPublic: !selectedPlaylist.isPublic });
    setSelectedPlaylist({ ...selectedPlaylist, isPublic: !selectedPlaylist.isPublic });
  }, [selectedPlaylist, updatePlaylist, setSelectedPlaylist]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <ListMusic size={28} color={Colors.accent} />
        <Text style={styles.title}>Playlists</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{playlists.length}</Text>
            <Text style={styles.statLabel}>Playlists</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{solvedMelodies.length}</Text>
            <Text style={styles.statLabel}>Solved Melodies</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.text} />
          <Text style={styles.createButtonText}>Create New Playlist</Text>
        </TouchableOpacity>

        {playlists.length === 0 ? (
          <View style={styles.emptyState}>
            <ListMusic size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptyDesc}>
              Create your first playlist to collect solved melodies
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Playlists</Text>
            {playlists.map(playlist => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPress={() => handleOpenPlaylist(playlist)}
                onDelete={() => handleDeletePlaylist(playlist.id)}
              />
            ))}
          </View>
        )}

        {solvedMelodies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Solves</Text>
            <Text style={styles.sectionSubtitle}>
              Add these to a playlist to build your collection
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentSolvesRow}
            >
              {solvedMelodies.slice(-10).reverse().map(melody => (
                <View key={melody.id} style={styles.recentSolveCard}>
                  <Music size={20} color={Colors.accent} />
                  <Text style={styles.recentSolveName} numberOfLines={1}>{melody.name}</Text>
                  <Text style={styles.recentSolveCategory}>{melody.category}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowCreateModal(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Create Playlist</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                placeholder="My awesome playlist"
                placeholderTextColor={Colors.textMuted}
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newPlaylistDesc}
                onChangeText={setNewPlaylistDesc}
                placeholder="What's this playlist about?"
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={100}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, !newPlaylistName.trim() && styles.submitButtonDisabled]}
              onPress={handleCreatePlaylist}
              disabled={!newPlaylistName.trim()}
            >
              <Text style={styles.submitButtonText}>Create Playlist</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showDetailModal && selectedPlaylist !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.detailModal]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowDetailModal(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>

            {selectedPlaylist && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailIcon}>
                    <ListMusic size={32} color={Colors.accent} />
                  </View>
                  <Text style={styles.detailTitle}>{selectedPlaylist.name}</Text>
                  <Text style={styles.detailMeta}>
                    {selectedPlaylist.melodies.length} melodies
                  </Text>
                </View>

                <View style={styles.detailActions}>
                  <TouchableOpacity 
                    style={styles.detailActionBtn}
                    onPress={() => setShowAddMelodiesModal(true)}
                  >
                    <Plus size={18} color={Colors.text} />
                    <Text style={styles.detailActionText}>Add</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.detailActionBtn}
                    onPress={handleTogglePublic}
                  >
                    <Share2 size={18} color={Colors.text} />
                    <Text style={styles.detailActionText}>
                      {selectedPlaylist.isPublic ? 'Private' : 'Share'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.detailActionBtn, styles.remixBtn]}
                    onPress={handleGenerateRemix}
                    disabled={isGeneratingRemix || selectedPlaylist.melodies.length === 0}
                  >
                    <Sparkles size={18} color={Colors.background} />
                    <Text style={[styles.detailActionText, styles.remixBtnText]}>
                      {isGeneratingRemix ? 'Creating...' : 'Remix'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {selectedPlaylist.remixUrl && (
                  <View style={styles.remixBanner}>
                    <Sparkles size={16} color={Colors.accent} />
                    <Text style={styles.remixBannerText}>AI Remix created!</Text>
                  </View>
                )}

                <ScrollView style={styles.melodyList}>
                  {selectedPlaylist.melodies.length === 0 ? (
                    <View style={styles.emptyMelodies}>
                      <Music size={32} color={Colors.textMuted} />
                      <Text style={styles.emptyMelodiesText}>No melodies yet</Text>
                    </View>
                  ) : (
                    selectedPlaylist.melodies.map(melody => (
                      <MelodyChip
                        key={melody.id}
                        melody={melody}
                        onRemove={() => handleRemoveMelody(melody.id)}
                      />
                    ))
                  )}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddMelodiesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMelodiesModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.addMelodiesModal]}>
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowAddMelodiesModal(false)}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add Melodies</Text>
            
            <ScrollView style={styles.solvedMelodiesList}>
              {solvedMelodies.length === 0 ? (
                <View style={styles.emptyMelodies}>
                  <Music size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyMelodiesText}>
                    Solve puzzles to add melodies!
                  </Text>
                </View>
              ) : (
                solvedMelodies.map(melody => (
                  <SolvedMelodyItem
                    key={melody.id}
                    melody={melody}
                    onAdd={() => handleAddMelody(melody.id)}
                    isInPlaylist={selectedPlaylist?.melodies.some(m => m.id === melody.id) ?? false}
                  />
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowAddMelodiesModal(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 14,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  playlistMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  playlistDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  playlistActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  recentSolvesRow: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  recentSolveCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  recentSolveName: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  recentSolveCategory: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  detailModal: {
    maxHeight: '80%',
  },
  addMelodiesModal: {
    maxHeight: '70%',
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  detailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  detailMeta: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 12,
  },
  detailActionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  remixBtn: {
    backgroundColor: Colors.accent,
  },
  remixBtnText: {
    color: Colors.background,
  },
  remixBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent + '20',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  remixBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  melodyList: {
    maxHeight: 300,
  },
  emptyMelodies: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMelodiesText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 12,
  },
  melodyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  melodyChipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  melodyChipNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    marginRight: 8,
  },
  melodyChipRemove: {
    padding: 4,
  },
  solvedMelodiesList: {
    maxHeight: 400,
  },
  solvedMelodyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  solvedMelodyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedMelodyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  solvedMelodyName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  solvedMelodyNotes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Colors.surface,
  },
  doneButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
