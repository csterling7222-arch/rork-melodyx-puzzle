import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
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
  Share,
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
  Award,
  Users,
  Clock,
  TrendingUp,
  ShoppingBag,
  Instagram,
  Twitter,
  Share2,
  Crown,
  Zap,
  MapPin,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  History,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/colors';
import { ArtistInfo, SongMetadata, getArtistInfo, ArtistMilestone, ArtistDiscography } from '@/constants/songLibrary';
import { Melody } from '@/utils/melodies';
import { generateText } from '@rork-ai/toolkit-sdk';
import { usePurchases } from '@/contexts/PurchasesContext';

const CACHE_KEY = 'melodyx_artist_cache_v1';
const AFFILIATE_TAGS = {
  spotify: 'ref=melodyx_app',
  apple: 'at=melodyx&ct=app',
  amazon: 'tag=melodyx-20',
  tidal: 'ref=melodyx',
  youtube: 'ref=melodyx',
};

interface ArtistSharingModalProps {
  visible: boolean;
  onClose: () => void;
  melody: Melody | null;
  songMetadata?: SongMetadata | null;
  onPracticeInLearning?: (songId: string) => void;
}

interface StreamingLinkProps {
  icon: React.ReactNode;
  name: string;
  url: string | undefined;
  color: string;
  affiliateTag?: string;
  isPremiumPlatform?: boolean;
  isPremiumUser?: boolean;
}

interface AIRecommendation {
  title: string;
  subtitle: string;
  type: 'artist' | 'song' | 'playlist';
  searchQuery: string;
}

function StreamingLink({ icon, name, url, color, affiliateTag, isPremiumPlatform, isPremiumUser }: StreamingLinkProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };
  
  const handlePress = useCallback(async () => {
    if (!url) return;
    
    let finalUrl = url;
    if (affiliateTag) {
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${affiliateTag}`;
    }
    
    try {
      console.log('[ArtistSharing] Opening URL:', finalUrl);
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

  const isLocked = isPremiumPlatform && !isPremiumUser;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.streamingLink, { borderColor: color + '40' }, isLocked && styles.streamingLinkLocked]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
        disabled={isLocked}
      >
        <View style={[styles.streamingIconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.streamingName}>{name}</Text>
        {isLocked ? (
          <Crown size={16} color="#FFD700" />
        ) : (
          <ExternalLink size={16} color={Colors.textMuted} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function TimelineItem({ milestone, isLast }: { milestone: ArtistMilestone; isLast: boolean }) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineDot} />
      {!isLast && <View style={styles.timelineLine} />}
      <View style={styles.timelineContent}>
        <Text style={styles.timelineYear}>{milestone.year}</Text>
        <Text style={styles.timelineEvent}>{milestone.event}</Text>
        <Text style={styles.timelineDesc}>{milestone.description}</Text>
      </View>
    </View>
  );
}

function DiscographyItem({ album }: { album: ArtistDiscography }) {
  return (
    <View style={styles.albumCard}>
      <View style={styles.albumCover}>
        <Disc3 size={24} color={Colors.accent} />
      </View>
      <Text style={styles.albumTitle} numberOfLines={1}>{album.title}</Text>
      <Text style={styles.albumYear}>{album.year}</Text>
    </View>
  );
}

function FanFactCard({ fact, index }: { fact: string; index: number }) {
  const icons = [Lightbulb, Star, Zap, Award];
  const IconComponent = icons[index % icons.length];
  
  return (
    <View style={styles.factCard}>
      <View style={styles.factIconContainer}>
        <IconComponent size={16} color={Colors.accent} />
      </View>
      <Text style={styles.factText}>{fact}</Text>
    </View>
  );
}

function RecommendationCard({ rec, onPress }: { rec: AIRecommendation; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.recommendationCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationTitle} numberOfLines={1}>{rec.title}</Text>
        <Text style={styles.recommendationSubtitle} numberOfLines={1}>{rec.subtitle}</Text>
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
  onPracticeInLearning,
}: ArtistSharingModalProps) {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { isPremium } = usePurchases();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  const artistName = songMetadata?.artist || melody?.artist || 'Unknown Artist';
  const artistInfo: ArtistInfo | null = getArtistInfo(artistName);
  const songName = songMetadata?.name || melody?.name || 'Unknown Song';

  const isIOS = Platform.OS === 'ios';
  const preferredPlatform = isIOS ? 'apple' : 'spotify';

  useEffect(() => {
    loadCachedData();
  }, []);

  const generateAIRecommendations = useCallback(async () => {
    if (!artistInfo || isLoadingRecs) return;
    
    setIsLoadingRecs(true);
    
    try {
      const prompt = `Based on ${artistName} and their ${artistInfo.genres?.join(', ')} style, suggest 3 similar artists or songs. Format as JSON array with objects containing: title (artist/song name), subtitle (brief reason), type (artist/song), searchQuery (search term). Keep it brief.`;
      
      const result = await generateText(prompt);
      
      if (result) {
        try {
          const jsonMatch = result.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const recs = JSON.parse(jsonMatch[0]);
            setAiRecommendations(recs.slice(0, 3));
          }
        } catch {
          setAiRecommendations([
            { title: artistInfo.similarArtists?.[0] || 'Similar Artist', subtitle: `Fans of ${artistName} also like`, type: 'artist', searchQuery: artistInfo.similarArtists?.[0] || '' },
            { title: `${songMetadata?.era || '2020s'} Hits`, subtitle: 'Explore the era', type: 'playlist', searchQuery: `${songMetadata?.era || '2020s'} hits` },
            { title: artistInfo.similarArtists?.[1] || 'Discover More', subtitle: 'Based on your taste', type: 'artist', searchQuery: artistInfo.similarArtists?.[1] || artistName },
          ]);
        }
      }
    } catch (error) {
      console.log('[ArtistSharing] AI recommendations error:', error);
      if (artistInfo.similarArtists) {
        setAiRecommendations(
          artistInfo.similarArtists.slice(0, 3).map((artist, i) => ({
            title: artist,
            subtitle: i === 0 ? `Similar to ${artistName}` : 'You might also like',
            type: 'artist' as const,
            searchQuery: artist,
          }))
        );
      }
    } finally {
      setIsLoadingRecs(false);
    }
  }, [artistInfo, artistName, songMetadata?.era, isLoadingRecs]);

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

      if (artistInfo) {
        generateAIRecommendations();
      }
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      setExpandedSection(null);
    }
  }, [visible, scaleAnim, opacityAnim, artistInfo, generateAIRecommendations]);

  const loadCachedData = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        console.log('[ArtistSharing] Loaded cached data');
      }
    } catch (error) {
      console.log('[ArtistSharing] Error loading cache:', error);
    }
  };

  const handleSearchPlatform = useCallback(async (platform: 'spotify' | 'apple' | 'youtube' | 'amazon' | 'tidal', query?: string) => {
    const searchQuery = encodeURIComponent(query || `${songName} ${artistName}`);
    const urls: Record<string, string> = {
      spotify: `https://open.spotify.com/search/${searchQuery}?${AFFILIATE_TAGS.spotify}`,
      apple: `https://music.apple.com/search?term=${searchQuery}&${AFFILIATE_TAGS.apple}`,
      youtube: `https://www.youtube.com/results?search_query=${searchQuery}&${AFFILIATE_TAGS.youtube}`,
      amazon: `https://music.amazon.com/search/${searchQuery}?${AFFILIATE_TAGS.amazon}`,
      tidal: `https://tidal.com/search?q=${searchQuery}&${AFFILIATE_TAGS.tidal}`,
    };
    
    try {
      await Linking.openURL(urls[platform]);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[ArtistSharing] Error searching platform:', error);
    }
  }, [songName, artistName]);

  const handleShare = useCallback(async () => {
    const shareUrl = artistInfo?.spotifyUrl || artistInfo?.appleMusicUrl || artistInfo?.youtubeUrl || '';
    const message = `🎵 I just discovered "${songName}" by ${artistName} on Melodyx!\n\nStream it here: ${shareUrl}\n\n#Melodyx #MusicDiscovery`;
    
    try {
      if (Platform.OS === 'web') {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(message);
        }
      } else {
        await Share.share({
          message,
          title: `${songName} by ${artistName}`,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('[ArtistSharing] Share error:', error);
    }
  }, [songName, artistName, artistInfo]);

  const handleOpenSocialMedia = useCallback(async (url: string) => {
    try {
      await Linking.openURL(url);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[ArtistSharing] Error opening social:', error);
    }
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const streamingPlatforms = useMemo(() => {
    const platforms = [];
    
    if (isIOS && (artistInfo?.appleMusicUrl || songMetadata?.appleMusicId)) {
      platforms.push({
        icon: <Music size={18} color="#FC3C44" />,
        name: 'Apple Music',
        url: artistInfo?.appleMusicUrl || (songMetadata?.appleMusicId ? `https://music.apple.com/song/${songMetadata.appleMusicId}` : undefined),
        color: '#FC3C44',
        affiliateTag: AFFILIATE_TAGS.apple,
      });
    }
    
    platforms.push({
      icon: <Play size={18} color="#1DB954" />,
      name: 'Spotify',
      url: artistInfo?.spotifyUrl || (songMetadata?.spotifyId ? `https://open.spotify.com/track/${songMetadata.spotifyId}` : undefined),
      color: '#1DB954',
      affiliateTag: AFFILIATE_TAGS.spotify,
    });
    
    if (!isIOS && (artistInfo?.appleMusicUrl || songMetadata?.appleMusicId)) {
      platforms.push({
        icon: <Music size={18} color="#FC3C44" />,
        name: 'Apple Music',
        url: artistInfo?.appleMusicUrl || (songMetadata?.appleMusicId ? `https://music.apple.com/song/${songMetadata.appleMusicId}` : undefined),
        color: '#FC3C44',
        affiliateTag: AFFILIATE_TAGS.apple,
      });
    }
    
    platforms.push({
      icon: <Play size={18} color="#FF0000" />,
      name: 'YouTube Music',
      url: artistInfo?.youtubeUrl || (songMetadata?.youtubeId ? `https://www.youtube.com/watch?v=${songMetadata.youtubeId}` : undefined),
      color: '#FF0000',
      affiliateTag: AFFILIATE_TAGS.youtube,
    });
    
    if (artistInfo?.soundCloudUrl) {
      platforms.push({
        icon: <Radio size={18} color="#FF5500" />,
        name: 'SoundCloud',
        url: artistInfo.soundCloudUrl,
        color: '#FF5500',
      });
    }
    
    if (artistInfo?.tidalUrl) {
      platforms.push({
        icon: <Headphones size={18} color="#00FFFF" />,
        name: 'Tidal',
        url: artistInfo.tidalUrl,
        color: '#00FFFF',
        affiliateTag: AFFILIATE_TAGS.tidal,
        isPremiumPlatform: true,
      });
    }
    
    if (artistInfo?.amazonMusicUrl) {
      platforms.push({
        icon: <Music size={18} color="#FF9900" />,
        name: 'Amazon Music',
        url: artistInfo.amazonMusicUrl,
        color: '#FF9900',
        affiliateTag: AFFILIATE_TAGS.amazon,
      });
    }
    
    return platforms;
  }, [artistInfo, songMetadata, isIOS]);

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
          <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="close-artist-modal">
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
              
              {artistInfo && (
                <View style={styles.statsRow}>
                  {artistInfo.monthlyListeners && (
                    <View style={styles.statChip}>
                      <Users size={12} color={Colors.accent} />
                      <Text style={styles.statText}>{artistInfo.monthlyListeners} listeners</Text>
                    </View>
                  )}
                  {artistInfo.originCountry && (
                    <View style={styles.statChip}>
                      <MapPin size={12} color={Colors.textSecondary} />
                      <Text style={styles.statText}>{artistInfo.originCountry}</Text>
                    </View>
                  )}
                </View>
              )}
              
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

              {artistInfo?.socialMedia && (
                <View style={styles.socialRow}>
                  {artistInfo.socialMedia.instagram && (
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleOpenSocialMedia(artistInfo.socialMedia!.instagram!)}
                    >
                      <Instagram size={18} color="#E4405F" />
                    </TouchableOpacity>
                  )}
                  {artistInfo.socialMedia.twitter && (
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleOpenSocialMedia(artistInfo.socialMedia!.twitter!)}
                    >
                      <Twitter size={18} color="#1DA1F2" />
                    </TouchableOpacity>
                  )}
                  {artistInfo.websiteUrl && (
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={() => handleOpenSocialMedia(artistInfo.websiteUrl!)}
                    >
                      <Globe size={18} color={Colors.accent} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {artistInfo?.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioText}>{artistInfo.fullBio || artistInfo.bio}</Text>
                {artistInfo.activeYears && (
                  <Text style={styles.activeYears}>
                    <Clock size={12} color={Colors.textMuted} /> Active: {artistInfo.activeYears}
                  </Text>
                )}
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
                {streamingPlatforms.map((platform, index) => (
                  <StreamingLink
                    key={index}
                    icon={platform.icon}
                    name={platform.name}
                    url={platform.url}
                    color={platform.color}
                    affiliateTag={platform.affiliateTag}
                    isPremiumPlatform={platform.isPremiumPlatform}
                    isPremiumUser={isPremium}
                  />
                ))}
              </View>

              {streamingPlatforms.every(p => !p.url) && (
                <View style={styles.searchSection}>
                  <Text style={styles.searchLabel}>Search for this song:</Text>
                  <View style={styles.searchButtons}>
                    <TouchableOpacity style={styles.searchButton} onPress={() => handleSearchPlatform(isIOS ? 'apple' : 'spotify')}>
                      {isIOS ? <Music size={14} color="#FC3C44" /> : <Play size={14} color="#1DB954" />}
                      <Text style={[styles.searchButtonText, { color: isIOS ? '#FC3C44' : '#1DB954' }]}>
                        {isIOS ? 'Apple' : 'Spotify'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.searchButton} onPress={() => handleSearchPlatform('youtube')}>
                      <Play size={14} color="#FF0000" />
                      <Text style={[styles.searchButtonText, { color: '#FF0000' }]}>YouTube</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Sparkles size={18} color={Colors.accent} />
                <Text style={styles.sectionTitle}>You Might Also Like</Text>
                {isLoadingRecs && <Text style={styles.loadingText}>AI generating...</Text>}
              </View>
              <View style={styles.recommendations}>
                {aiRecommendations.length > 0 ? (
                  aiRecommendations.map((rec, index) => (
                    <RecommendationCard
                      key={index}
                      rec={rec}
                      onPress={() => handleSearchPlatform(preferredPlatform, rec.searchQuery)}
                    />
                  ))
                ) : (
                  artistInfo?.similarArtists?.slice(0, 3).map((artist, index) => (
                    <RecommendationCard
                      key={index}
                      rec={{
                        title: artist,
                        subtitle: `Similar to ${artistName}`,
                        type: 'artist',
                        searchQuery: artist,
                      }}
                      onPress={() => handleSearchPlatform(preferredPlatform, artist)}
                    />
                  ))
                )}
              </View>
            </View>

            {artistInfo?.fanFacts && artistInfo.fanFacts.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader} 
                  onPress={() => toggleSection('facts')}
                >
                  <View style={styles.sectionHeader}>
                    <Lightbulb size={18} color="#FBBF24" />
                    <Text style={styles.sectionTitle}>Fun Facts</Text>
                  </View>
                  {expandedSection === 'facts' ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {expandedSection === 'facts' && (
                  <View style={styles.factsContainer}>
                    {artistInfo.fanFacts.map((fact, index) => (
                      <FanFactCard key={index} fact={fact} index={index} />
                    ))}
                  </View>
                )}
              </View>
            )}

            {artistInfo?.timeline && artistInfo.timeline.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader} 
                  onPress={() => toggleSection('timeline')}
                >
                  <View style={styles.sectionHeader}>
                    <History size={18} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Career Timeline</Text>
                  </View>
                  {expandedSection === 'timeline' ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {expandedSection === 'timeline' && (
                  <View style={styles.timelineContainer}>
                    {artistInfo.timeline.map((milestone, index) => (
                      <TimelineItem
                        key={index}
                        milestone={milestone}
                        isLast={index === artistInfo.timeline!.length - 1}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {artistInfo?.discography && artistInfo.discography.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader} 
                  onPress={() => toggleSection('discography')}
                >
                  <View style={styles.sectionHeader}>
                    <Disc3 size={18} color={Colors.accent} />
                    <Text style={styles.sectionTitle}>Discography</Text>
                  </View>
                  {expandedSection === 'discography' ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {expandedSection === 'discography' && (
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.discographyScroll}
                  >
                    {artistInfo.discography.map((album, index) => (
                      <DiscographyItem key={index} album={album} />
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {artistInfo?.awards && artistInfo.awards.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity 
                  style={styles.collapsibleHeader} 
                  onPress={() => toggleSection('awards')}
                >
                  <View style={styles.sectionHeader}>
                    <Award size={18} color="#FFD700" />
                    <Text style={styles.sectionTitle}>Awards & Recognition</Text>
                  </View>
                  {expandedSection === 'awards' ? (
                    <ChevronUp size={20} color={Colors.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
                {expandedSection === 'awards' && (
                  <View style={styles.awardsContainer}>
                    {artistInfo.awards.map((award, index) => (
                      <View key={index} style={styles.awardChip}>
                        <Award size={12} color="#FFD700" />
                        <Text style={styles.awardText}>{award}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {artistInfo?.merchUrl && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.merchButton}
                  onPress={() => artistInfo.merchUrl && Linking.openURL(artistInfo.merchUrl)}
                >
                  <ShoppingBag size={18} color={Colors.accent} />
                  <Text style={styles.merchButtonText}>Shop Official Merch</Text>
                  <ExternalLink size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            )}

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
                🎵 Streaming through these links supports the artist. Melodyx may earn a small commission from affiliate programs at no extra cost to you. All music content is subject to respective platform terms.
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Share2 size={18} color={Colors.text} />
                <Text style={styles.shareButtonText}>Share Artist</Text>
              </TouchableOpacity>

              {onPracticeInLearning && songMetadata?.id && (
                <TouchableOpacity 
                  style={styles.practiceButton} 
                  onPress={() => {
                    onPracticeInLearning(songMetadata.id);
                    onClose();
                  }}
                >
                  <TrendingUp size={18} color={Colors.background} />
                  <Text style={styles.practiceButtonText}>Practice in Learning</Text>
                </TouchableOpacity>
              )}

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
    maxWidth: 420,
    maxHeight: '92%',
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
    borderWidth: 3,
    borderColor: Colors.accent + '40',
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
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statText: {
    fontSize: 11,
    color: Colors.textSecondary,
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
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  activeYears: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  loadingText: {
    fontSize: 11,
    color: Colors.accent,
    marginLeft: 'auto',
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
  streamingLinkLocked: {
    opacity: 0.6,
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
  factsContainer: {
    gap: 10,
  },
  factCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  factIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  factText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
    marginRight: 12,
    marginTop: 4,
    zIndex: 1,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 16,
    width: 2,
    height: '100%',
    backgroundColor: Colors.accent + '40',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineYear: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  timelineEvent: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  timelineDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  discographyScroll: {
    marginTop: 12,
  },
  albumCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 12,
  },
  albumCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  albumYear: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  awardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  awardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700' + '15',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700' + '30',
  },
  awardText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500' as const,
  },
  merchButton: {
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
  merchButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
    flex: 1,
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
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  actionButtons: {
    gap: 12,
    paddingBottom: 20,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.correct,
    paddingVertical: 14,
    borderRadius: 14,
  },
  practiceButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.background,
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
