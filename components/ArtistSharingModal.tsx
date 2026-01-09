import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Linking,
  Image,
  Platform,
  ScrollView,
} from 'react-native';
import {
  X,
  ExternalLink,
  Music,
  Play,
  Heart,
  Headphones,
  Radio,
  Disc3,
  Globe,
  ChevronRight,
  Sparkles,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { ArtistInfo, SongMetadata, getArtistInfo } from '@/constants/songLibrary';
import { Melody } from '@/utils/melodies';

interface ArtistSharingModalProps {
  visible: boolean;
  onClose: () => void;
  melody: Melody | null;
  songMetadata?: SongMetadata | null;
}

interface StreamingLinkProps {
  icon: React.ReactNode;
  name: string;
  url: string | undefined;
  color: string;
  affiliateTag?: string;
}

function StreamingLink({ icon, name, url, color, affiliateTag }: StreamingLinkProps) {
  const handlePress = useCallback(async () => {
    if (!url) return;
    
    let finalUrl = url;
    if (affiliateTag) {
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${affiliateTag}`;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(finalUrl);
      if (canOpen) {
        await Linking.openURL(finalUrl);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.log('[ArtistSharing] Error opening URL:', error);
    }
  }, [url, affiliateTag]);

  if (!url) return null;

  return (
    <TouchableOpacity
      style={[styles.streamingLink, { borderColor: color + '40' }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={[styles.streamingIconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <Text style={styles.streamingName}>{name}</Text>
      <ExternalLink size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

interface RecommendationCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
}

function RecommendationCard({ title, subtitle, onPress }: RecommendationCardProps) {
  return (
    <TouchableOpacity style={styles.recommendationCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.recommendationSubtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function ArtistSharingModal({
  visible,
  onClose,
  melody,
  songMetadata,
}: ArtistSharingModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const artistName = songMetadata?.artist || melody?.artist || 'Unknown Artist';
  const artistInfo: ArtistInfo | null = getArtistInfo(artistName);
  const songName = songMetadata?.name || melody?.name || 'Unknown Song';

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleSearchSpotify = useCallback(async () => {
    const searchQuery = encodeURIComponent(`${songName} ${artistName}`);
    const url = `https://open.spotify.com/search/${searchQuery}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('[ArtistSharing] Error searching Spotify:', error);
    }
  }, [songName, artistName]);

  const handleSearchAppleMusic = useCallback(async () => {
    const searchQuery = encodeURIComponent(`${songName} ${artistName}`);
    const url = `https://music.apple.com/search?term=${searchQuery}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('[ArtistSharing] Error searching Apple Music:', error);
    }
  }, [songName, artistName]);

  const handleSearchYouTube = useCallback(async () => {
    const searchQuery = encodeURIComponent(`${songName} ${artistName} official`);
    const url = `https://www.youtube.com/results?search_query=${searchQuery}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log('[ArtistSharing] Error searching YouTube:', error);
    }
  }, [songName, artistName]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              {artistInfo?.imageUrl ? (
                <Image
                  source={{ uri: artistInfo.imageUrl }}
                  style={styles.artistImage}
                />
              ) : (
                <View style={styles.artistImagePlaceholder}>
                  <Music size={40} color={Colors.accent} />
                </View>
              )}
              
              <Text style={styles.songTitle}>{songName}</Text>
              <Text style={styles.artistNameText}>{artistName}</Text>
              
              {songMetadata && (
                <View style={styles.metaRow}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>{songMetadata.genre}</Text>
                  </View>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaText}>{songMetadata.year}</Text>
                  </View>
                  {songMetadata.album && (
                    <View style={styles.metaChip}>
                      <Disc3 size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{songMetadata.album}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {artistInfo?.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioText}>{artistInfo.bio}</Text>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Headphones size={18} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Stream Full Track</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Support the artist by streaming their music
              </Text>

              <View style={styles.streamingLinks}>
                <StreamingLink
                  icon={<Play size={18} color="#1DB954" />}
                  name="Spotify"
                  url={artistInfo?.spotifyUrl || songMetadata?.spotifyId ? `https://open.spotify.com/track/${songMetadata?.spotifyId}` : undefined}
                  color="#1DB954"
                  affiliateTag="ref=melodyx"
                />
                <StreamingLink
                  icon={<Music size={18} color="#FC3C44" />}
                  name="Apple Music"
                  url={artistInfo?.appleMusicUrl || songMetadata?.appleMusicId ? `https://music.apple.com/song/${songMetadata?.appleMusicId}` : undefined}
                  color="#FC3C44"
                  affiliateTag="at=melodyx"
                />
                <StreamingLink
                  icon={<Play size={18} color="#FF0000" />}
                  name="YouTube Music"
                  url={artistInfo?.youtubeUrl || songMetadata?.youtubeId ? `https://www.youtube.com/watch?v=${songMetadata?.youtubeId}` : undefined}
                  color="#FF0000"
                />
                {artistInfo?.soundCloudUrl && (
                  <StreamingLink
                    icon={<Radio size={18} color="#FF5500" />}
                    name="SoundCloud"
                    url={artistInfo.soundCloudUrl}
                    color="#FF5500"
                  />
                )}
                {artistInfo?.tidalUrl && (
                  <StreamingLink
                    icon={<Headphones size={18} color="#00FFFF" />}
                    name="Tidal"
                    url={artistInfo.tidalUrl}
                    color="#00FFFF"
                  />
                )}
                {artistInfo?.amazonMusicUrl && (
                  <StreamingLink
                    icon={<Music size={18} color="#FF9900" />}
                    name="Amazon Music"
                    url={artistInfo.amazonMusicUrl}
                    color="#FF9900"
                  />
                )}
              </View>

              {(!artistInfo?.spotifyUrl && !songMetadata?.spotifyId) && (
                <View style={styles.searchSection}>
                  <Text style={styles.searchLabel}>Can not find direct link? Search:</Text>
                  <View style={styles.searchButtons}>
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchSpotify}>
                      <Play size={14} color="#1DB954" />
                      <Text style={[styles.searchButtonText, { color: '#1DB954' }]}>Spotify</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchAppleMusic}>
                      <Music size={14} color="#FC3C44" />
                      <Text style={[styles.searchButtonText, { color: '#FC3C44' }]}>Apple</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchYouTube}>
                      <Play size={14} color="#FF0000" />
                      <Text style={[styles.searchButtonText, { color: '#FF0000' }]}>YouTube</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {artistInfo?.websiteUrl && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Globe size={18} color={Colors.accent} />
                  <Text style={styles.sectionTitle}>Official Website</Text>
                </View>
                <TouchableOpacity
                  style={styles.websiteButton}
                  onPress={() => artistInfo.websiteUrl && Linking.openURL(artistInfo.websiteUrl)}
                >
                  <Text style={styles.websiteButtonText}>Visit {artistName}&apos;s Website</Text>
                  <ExternalLink size={16} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={18} color={Colors.accent} />
                <Text style={styles.sectionTitle}>You Might Also Like</Text>
              </View>
              <View style={styles.recommendations}>
                <RecommendationCard
                  title="Similar Artists"
                  subtitle={`Fans of ${artistName} also like...`}
                  onPress={handleSearchSpotify}
                />
                <RecommendationCard
                  title="More from this Era"
                  subtitle={songMetadata?.era || melody?.era || 'Classic hits'}
                  onPress={handleSearchSpotify}
                />
              </View>
            </View>

            {songMetadata?.trivia && (
              <View style={styles.triviaSection}>
                <View style={styles.triviaHeader}>
                  <Star size={16} color="#FBBF24" fill="#FBBF24" />
                  <Text style={styles.triviaTitle}>Did You Know?</Text>
                </View>
                <Text style={styles.triviaText}>{songMetadata.trivia}</Text>
              </View>
            )}

            <View style={styles.disclaimerSection}>
              <Text style={styles.disclaimerText}>
                🎵 Streaming through these links supports the artist. Melodyx may earn a small commission from affiliate programs at no extra cost to you.
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.primaryButton} onPress={onClose}>
                <Heart size={18} color={Colors.background} />
                <Text style={styles.primaryButtonText}>Thanks for Supporting Artists!</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  artistImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  artistImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  artistNameText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bioSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  streamingLinks: {
    gap: 10,
  },
  streamingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  streamingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streamingName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  searchSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  searchLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
    textAlign: 'center',
  },
  searchButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
  },
  searchButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  websiteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  recommendations: {
    gap: 10,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 14,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  recommendationSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  triviaSection: {
    backgroundColor: '#FBBF24' + '15',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FBBF24' + '30',
  },
  triviaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  triviaTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FBBF24',
  },
  triviaText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  disclaimerSection: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
