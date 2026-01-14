import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Coins, Palette, Crown, Check, RotateCcw, Sparkles, Star, Gift, Clock,
  Paintbrush, Award, Shield, BookOpen, Guitar
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { usePurchases, PACKAGE_IDENTIFIERS } from '@/contexts/PurchasesContext';
import { 
  KEYBOARD_SKINS, KeyboardSkin, COLOR_THEMES, ColorTheme, COSMETIC_ITEMS, CosmeticItem,
  POWER_UPS, PowerUp, LEARNING_PACKS, LearningPack, INSTRUMENT_ADDONS, InstrumentAddon,
  SHOP_BUNDLES, ShopBundle, getFeaturedBundles
} from '@/constants/shop';


type ShopTab = 'featured' | 'themes' | 'skins' | 'cosmetics' | 'powerups' | 'learning' | 'instruments' | 'coins' | 'premium';

const RARITY_COLORS: Record<string, string> = {
  common: '#9CA3AF',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#FFD700',
};

function TrialBanner({ daysRemaining, onUpgrade }: { daysRemaining: number; onUpgrade: () => void }) {
  if (daysRemaining <= 0) return null;
  
  return (
    <View style={trialStyles.container}>
      <View style={trialStyles.content}>
        <View style={trialStyles.iconContainer}>
          <Clock size={24} color="#FFD700" />
        </View>
        <View style={trialStyles.textContainer}>
          <Text style={trialStyles.title}>Premium Trial Active</Text>
          <Text style={trialStyles.subtitle}>
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
          </Text>
        </View>
        <TouchableOpacity style={trialStyles.upgradeButton} onPress={onUpgrade}>
          <Text style={trialStyles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const trialStyles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#FFD700' + '15',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700' + '40',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: '#FFD700',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  upgradeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});

function SkinPreview({ skin, isOwned, isEquipped, onBuy, onEquip }: { 
  skin: KeyboardSkin; 
  isOwned: boolean;
  isEquipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  return (
    <View style={[skinStyles.skinCard, isEquipped && skinStyles.skinCardEquipped]}>
      <View style={skinStyles.skinHeader}>
        <Text style={skinStyles.skinIcon}>{skin.icon}</Text>
        <View style={skinStyles.skinInfo}>
          <Text style={skinStyles.skinName}>{skin.name}</Text>
          <Text style={skinStyles.skinPreviewText}>{skin.preview}</Text>
        </View>
        {skin.rarity && (
          <View style={[skinStyles.rarityBadge, { backgroundColor: RARITY_COLORS[skin.rarity] + '20' }]}>
            <Text style={[skinStyles.rarityText, { color: RARITY_COLORS[skin.rarity] }]}>
              {skin.rarity.toUpperCase()}
            </Text>
          </View>
        )}
        {isEquipped && (
          <View style={skinStyles.equippedBadge}>
            <Check size={12} color={Colors.correct} />
          </View>
        )}
      </View>
      
      <View style={skinStyles.skinPreview}>
        {notes.map(note => (
          <View 
            key={note}
            style={[skinStyles.previewKey, { backgroundColor: skin.colors[note] }]}
          >
            <Text style={[skinStyles.previewKeyText, { color: skin.textColors[note] }]}>{note}</Text>
          </View>
        ))}
      </View>

      {!isOwned ? (
        <TouchableOpacity style={skinStyles.buyButton} onPress={onBuy}>
          <Coins size={14} color="#FFD700" />
          <Text style={skinStyles.buyButtonText}>{skin.price || 500}</Text>
        </TouchableOpacity>
      ) : !isEquipped ? (
        <TouchableOpacity style={skinStyles.equipButton} onPress={onEquip}>
          <Text style={skinStyles.equipButtonText}>Equip</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const skinStyles = StyleSheet.create({
  skinCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  skinCardEquipped: {
    borderColor: Colors.correct,
  },
  skinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skinIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  skinInfo: {
    flex: 1,
  },
  skinName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  skinPreviewText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  equippedBadge: {
    backgroundColor: Colors.correct + '20',
    padding: 6,
    borderRadius: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  skinPreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  previewKey: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewKeyText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  equipButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  equipButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});

function ThemeCard({ theme, isOwned, isEquipped, onBuy, onEquip }: {
  theme: ColorTheme;
  isOwned: boolean;
  isEquipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  return (
    <View style={[themeStyles.card, isEquipped && themeStyles.cardEquipped]}>
      <View style={themeStyles.preview}>
        <View style={[themeStyles.previewBar, { backgroundColor: theme.primary }]} />
        <View style={[themeStyles.previewBar, { backgroundColor: theme.secondary }]} />
        <View style={[themeStyles.previewBar, { backgroundColor: theme.accent }]} />
      </View>
      <View style={themeStyles.header}>
        <Text style={themeStyles.icon}>{theme.icon}</Text>
        <View style={themeStyles.info}>
          <Text style={themeStyles.name}>{theme.name}</Text>
          <Text style={themeStyles.description} numberOfLines={1}>{theme.description}</Text>
        </View>
      </View>
      <View style={themeStyles.badges}>
        <View style={[themeStyles.rarityBadge, { backgroundColor: RARITY_COLORS[theme.rarity] + '20' }]}>
          <Text style={[themeStyles.rarityText, { color: RARITY_COLORS[theme.rarity] }]}>
            {theme.rarity.toUpperCase()}
          </Text>
        </View>
        {theme.hasGlow && (
          <View style={themeStyles.featureBadge}>
            <Sparkles size={10} color={Colors.accent} />
            <Text style={themeStyles.featureText}>Glow</Text>
          </View>
        )}
        {theme.hasParticles && (
          <View style={themeStyles.featureBadge}>
            <Star size={10} color={Colors.warning} />
            <Text style={themeStyles.featureText}>Particles</Text>
          </View>
        )}
      </View>
      {!isOwned ? (
        <TouchableOpacity style={themeStyles.buyButton} onPress={onBuy}>
          <Coins size={14} color="#FFD700" />
          <Text style={themeStyles.buyButtonText}>{theme.price}</Text>
        </TouchableOpacity>
      ) : !isEquipped ? (
        <TouchableOpacity style={themeStyles.equipButton} onPress={onEquip}>
          <Text style={themeStyles.equipButtonText}>Equip</Text>
        </TouchableOpacity>
      ) : (
        <View style={themeStyles.equippedIndicator}>
          <Check size={14} color={Colors.correct} />
          <Text style={themeStyles.equippedText}>Equipped</Text>
        </View>
      )}
    </View>
  );
}

const themeStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardEquipped: {
    borderColor: Colors.correct,
  },
  preview: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  previewBar: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 9,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  equipButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  equipButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  equippedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  equippedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});

function CosmeticCard({ item, isOwned, onBuy }: {
  item: CosmeticItem;
  isOwned: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={cosmeticStyles.card}>
      <Text style={cosmeticStyles.icon}>{item.icon}</Text>
      <Text style={cosmeticStyles.name}>{item.name}</Text>
      <Text style={cosmeticStyles.type}>{item.type.replace('_', ' ')}</Text>
      <View style={[cosmeticStyles.rarityBadge, { backgroundColor: RARITY_COLORS[item.rarity] + '20' }]}>
        <Text style={[cosmeticStyles.rarityText, { color: RARITY_COLORS[item.rarity] }]}>
          {item.rarity.toUpperCase()}
        </Text>
      </View>
      {!isOwned ? (
        <TouchableOpacity style={cosmeticStyles.buyButton} onPress={onBuy}>
          {item.currency === 'coins' ? (
            <Coins size={12} color="#FFD700" />
          ) : (
            <Text style={cosmeticStyles.dollarSign}>$</Text>
          )}
          <Text style={cosmeticStyles.buyButtonText}>
            {item.currency === 'coins' ? item.price : item.price.toFixed(2)}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={cosmeticStyles.ownedBadge}>
          <Check size={12} color={Colors.correct} />
          <Text style={cosmeticStyles.ownedText}>Owned</Text>
        </View>
      )}
    </View>
  );
}

const cosmeticStyles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 36,
    marginBottom: 8,
  },
  name: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  type: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%',
  },
  dollarSign: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.correct,
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.correct + '20',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  ownedText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});

function PowerUpCard({ powerUp, owned, onBuy }: {
  powerUp: PowerUp;
  owned: number;
  onBuy: () => void;
}) {
  return (
    <View style={powerUpStyles.card}>
      <View style={powerUpStyles.header}>
        <Text style={powerUpStyles.icon}>{powerUp.icon}</Text>
        <View style={powerUpStyles.info}>
          <Text style={powerUpStyles.name}>{powerUp.name}</Text>
          <Text style={powerUpStyles.description} numberOfLines={2}>{powerUp.description}</Text>
        </View>
        {owned > 0 && (
          <View style={powerUpStyles.ownedBadge}>
            <Text style={powerUpStyles.ownedCount}>x{owned}</Text>
          </View>
        )}
      </View>
      <View style={powerUpStyles.footer}>
        <View style={[powerUpStyles.rarityBadge, { backgroundColor: RARITY_COLORS[powerUp.rarity] + '20' }]}>
          <Text style={[powerUpStyles.rarityText, { color: RARITY_COLORS[powerUp.rarity] }]}>
            {powerUp.rarity.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={powerUpStyles.buyButton} onPress={onBuy}>
          <Coins size={12} color="#FFD700" />
          <Text style={powerUpStyles.buyButtonText}>{powerUp.price}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const powerUpStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  ownedBadge: {
    backgroundColor: Colors.accent + '30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownedCount: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buyButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
});

function LearningPackCard({ pack, isOwned, onBuy }: {
  pack: LearningPack;
  isOwned: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={learningStyles.card}>
      <View style={learningStyles.header}>
        <Text style={learningStyles.icon}>{pack.icon}</Text>
        <View style={learningStyles.info}>
          <Text style={learningStyles.name}>{pack.name}</Text>
          <Text style={learningStyles.lessons}>{pack.lessons} lessons</Text>
        </View>
        <View style={[learningStyles.difficultyBadge, { backgroundColor: getDifficultyColor(pack.difficulty) + '20' }]}>
          <Text style={[learningStyles.difficultyText, { color: getDifficultyColor(pack.difficulty) }]}>
            {pack.difficulty.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={learningStyles.description}>{pack.description}</Text>
      <View style={learningStyles.features}>
        {pack.features.slice(0, 3).map((feature, idx) => (
          <View key={idx} style={learningStyles.featureItem}>
            <Check size={12} color={Colors.correct} />
            <Text style={learningStyles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      {!isOwned ? (
        <TouchableOpacity style={learningStyles.buyButton} onPress={onBuy}>
          <Text style={learningStyles.buyButtonText}>${pack.price.toFixed(2)}</Text>
        </TouchableOpacity>
      ) : (
        <View style={learningStyles.ownedBadge}>
          <Check size={14} color={Colors.correct} />
          <Text style={learningStyles.ownedText}>Owned</Text>
        </View>
      )}
    </View>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return '#22C55E';
    case 'intermediate': return '#F59E0B';
    case 'advanced': return '#EF4444';
    case 'master': return '#A855F7';
    default: return Colors.textSecondary;
  }
}

const learningStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 36,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  lessons: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  features: {
    gap: 6,
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 12,
    color: Colors.text,
  },
  buyButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.correct + '20',
    paddingVertical: 12,
    borderRadius: 10,
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});

function BundleCard({ bundle, isOwned, onBuy }: {
  bundle: ShopBundle;
  isOwned: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={[bundleStyles.card, bundle.featured && bundleStyles.cardFeatured]}>
      {bundle.featured && (
        <View style={bundleStyles.featuredBadge}>
          <Star size={10} color="#000" fill="#FFD700" />
          <Text style={bundleStyles.featuredText}>FEATURED</Text>
        </View>
      )}
      <Text style={bundleStyles.icon}>{bundle.icon}</Text>
      <Text style={bundleStyles.name}>{bundle.name}</Text>
      <Text style={bundleStyles.description}>{bundle.description}</Text>
      <Text style={bundleStyles.bundlePrice}>${bundle.bundlePrice.toFixed(2)}</Text>
      {!isOwned ? (
        <TouchableOpacity style={bundleStyles.buyButton} onPress={onBuy}>
          <Text style={bundleStyles.buyButtonText}>Get Bundle</Text>
        </TouchableOpacity>
      ) : (
        <View style={bundleStyles.ownedBadge}>
          <Check size={14} color={Colors.correct} />
          <Text style={bundleStyles.ownedText}>Owned</Text>
        </View>
      )}
    </View>
  );
}

const bundleStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardFeatured: {
    borderColor: '#FFD700',
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800' as const,
    color: '#000',
  },
  icon: {
    fontSize: 44,
    marginTop: 8,
    marginBottom: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  bundlePrice: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFD700',
    marginBottom: 14,
  },
  buyButton: {
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.correct + '20',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});

function InstrumentAddonCard({ addon, isOwned, onBuy }: {
  addon: InstrumentAddon;
  isOwned: boolean;
  onBuy: () => void;
}) {
  return (
    <View style={addonStyles.card}>
      <View style={addonStyles.header}>
        <Text style={addonStyles.icon}>{addon.icon}</Text>
        <View style={addonStyles.info}>
          <Text style={addonStyles.name}>{addon.name}</Text>
          <Text style={addonStyles.instrument}>{addon.instrument === 'all' ? 'All Instruments' : addon.instrument}</Text>
        </View>
        <View style={[addonStyles.rarityBadge, { backgroundColor: RARITY_COLORS[addon.rarity] + '20' }]}>
          <Text style={[addonStyles.rarityText, { color: RARITY_COLORS[addon.rarity] }]}>
            {addon.rarity.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={addonStyles.description}>{addon.description}</Text>
      {addon.effects && (
        <View style={addonStyles.effects}>
          {addon.effects.map((effect, idx) => (
            <View key={idx} style={addonStyles.effectTag}>
              <Text style={addonStyles.effectText}>{effect}</Text>
            </View>
          ))}
        </View>
      )}
      {!isOwned ? (
        <TouchableOpacity style={addonStyles.buyButton} onPress={onBuy}>
          {addon.currency === 'coins' ? (
            <Coins size={14} color="#FFD700" />
          ) : null}
          <Text style={addonStyles.buyButtonText}>
            {addon.currency === 'coins' ? addon.price : `$${addon.price.toFixed(2)}`}
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={addonStyles.ownedBadge}>
          <Check size={14} color={Colors.correct} />
          <Text style={addonStyles.ownedText}>Owned</Text>
        </View>
      )}
    </View>
  );
}

const addonStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  instrument: {
    fontSize: 11,
    color: Colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rarityText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  description: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  effects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  effectTag: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  effectText: {
    fontSize: 10,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  ownedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.correct + '20',
    paddingVertical: 10,
    borderRadius: 10,
  },
  ownedText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.correct,
  },
});

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { 
    inventory, spendCoins, purchaseSkin, equipSkin, addHints, addCoins,
    purchaseTheme, equipTheme, purchaseCosmetic, purchasePowerUp, purchaseLearningPack,
    purchaseInstrumentAddon, purchaseBundle
  } = useUser();
  const { 
    purchasePackage, 
    restorePurchases, 
    isPurchasing,
    isRestoring,
    isLoading: isPurchasesLoading,
    isConfigured,
    getPackageByIdentifier,
    getMockPrice,
    calculateSavings,
    isPremium,
    isTrialActive,
    trialDaysRemaining,
    hasUsedTrial,
    startFreeTrial,
    enableDemoPremium,
  } = usePurchases();
  
  const [selectedTab, setSelectedTab] = useState<ShopTab>('featured');
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleBuySkin = useCallback((skinId: string, price: number) => {
    if (inventory.coins < price) {
      Alert.alert('Not Enough Coins', 'You need more coins to purchase this skin.');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy this skin for ${price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const success = spendCoins(price);
            if (success) {
              purchaseSkin(skinId);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          },
        },
      ]
    );
  }, [inventory.coins, spendCoins, purchaseSkin]);

  const handleEquipSkin = useCallback((skinId: string) => {
    equipSkin(skinId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [equipSkin]);

  const handleBuyTheme = useCallback((themeId: string, price: number) => {
    if (inventory.coins < price) {
      Alert.alert('Not Enough Coins', 'You need more coins to purchase this theme.');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy this theme for ${price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const success = spendCoins(price);
            if (success) {
              purchaseTheme(themeId);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          },
        },
      ]
    );
  }, [inventory.coins, spendCoins, purchaseTheme]);

  const handleEquipTheme = useCallback((themeId: string) => {
    equipTheme(themeId);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [equipTheme]);

  const handleIAPPurchase = useCallback(async (packageId: string, rewardType?: 'coins' | 'hints', rewardAmount?: number) => {
    const pkg = getPackageByIdentifier(packageId);
    
    console.log('[Shop] Purchase attempt:', { packageId, isConfigured, hasPkg: !!pkg });
    
    if (!isConfigured || !pkg) {
      console.log('[Shop] Store not configured or package not found, using demo mode for:', packageId);
      
      setPurchasingPackage(packageId);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (rewardType === 'coins' && rewardAmount) {
        console.log('[Shop] Adding coins:', rewardAmount);
        addCoins(rewardAmount);
        Alert.alert('🎉 Demo Purchase!', `You received ${rewardAmount} coins!`);
      } else if (rewardType === 'hints' && rewardAmount) {
        console.log('[Shop] Adding hints:', rewardAmount);
        addHints(rewardAmount);
        Alert.alert('💡 Hints Added!', `You received ${rewardAmount} hints! Your hints have been credited.`);
      } else if (packageId.includes('monthly') || packageId.includes('annual') || packageId.includes('yearly')) {
        enableDemoPremium();
        Alert.alert('👑 Demo Premium Activated!', 'Premium features enabled for testing.');
      } else if (packageId.startsWith('bundle_')) {
        const bundleId = packageId.replace('bundle_', '');
        const bundle = SHOP_BUNDLES.find(b => b.id === bundleId);
        if (bundle) {
          purchaseBundle(bundleId, bundle.items);
          Alert.alert('🎁 Bundle Purchased!', `${bundle.name} unlocked!`);
        }
      } else if (packageId.startsWith('learning_')) {
        const packId = packageId.replace('learning_', '');
        purchaseLearningPack(packId);
        Alert.alert('📚 Learning Pack Unlocked!', 'Your new lessons are ready!');
      } else {
        Alert.alert('🎁 Demo Mode', 'Demo purchase successful!');
      }
      
      setPurchasingPackage(null);
      return;
    }

    setPurchasingPackage(packageId);
    
    try {
      const result = await purchasePackage(pkg);
      
      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (rewardType === 'coins' && rewardAmount) {
          addCoins(rewardAmount);
          Alert.alert('🎉 Purchase Complete!', `You received ${rewardAmount} coins!`);
        } else if (rewardType === 'hints' && rewardAmount) {
          addHints(rewardAmount);
          Alert.alert('💡 Hints Added!', `You received ${rewardAmount} hints!`);
        }
      } else if (result.error && result.error !== 'cancelled') {
        Alert.alert('Purchase Failed', result.error);
      }
    } catch (err) {
      console.log('[Shop] Purchase error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setPurchasingPackage(null);
    }
  }, [getPackageByIdentifier, purchasePackage, addCoins, addHints, isConfigured, enableDemoPremium, purchaseBundle, purchaseLearningPack]);

  const handleBuyCosmetic = useCallback((cosmetic: CosmeticItem) => {
    if (cosmetic.currency === 'coins') {
      if (inventory.coins < cosmetic.price) {
        Alert.alert('Not Enough Coins', 'You need more coins to purchase this item.');
        return;
      }

      Alert.alert(
        'Confirm Purchase',
        `Buy ${cosmetic.name} for ${cosmetic.price} coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: () => {
              const success = spendCoins(cosmetic.price);
              if (success) {
                purchaseCosmetic(cosmetic.id);
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            },
          },
        ]
      );
    } else {
      handleIAPPurchase(`cosmetic_${cosmetic.id}`);
    }
  }, [inventory.coins, spendCoins, purchaseCosmetic, handleIAPPurchase]);

  const handleBuyPowerUp = useCallback((powerUp: PowerUp) => {
    if (inventory.coins < powerUp.price) {
      Alert.alert('Not Enough Coins', 'You need more coins to purchase this power-up.');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Buy ${powerUp.name} for ${powerUp.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const success = spendCoins(powerUp.price);
            if (success) {
              purchasePowerUp(powerUp.id, 1);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          },
        },
      ]
    );
  }, [inventory.coins, spendCoins, purchasePowerUp]);

  const handleBuyLearningPack = useCallback((pack: LearningPack) => {
    handleIAPPurchase(`learning_${pack.id}`);
  }, [handleIAPPurchase]);

  const handleBuyInstrumentAddon = useCallback((addon: InstrumentAddon) => {
    if (addon.currency === 'coins') {
      if (inventory.coins < addon.price) {
        Alert.alert('Not Enough Coins', 'You need more coins to purchase this add-on.');
        return;
      }

      Alert.alert(
        'Confirm Purchase',
        `Buy ${addon.name} for ${addon.price} coins?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Buy',
            onPress: () => {
              const success = spendCoins(addon.price);
              if (success) {
                purchaseInstrumentAddon(addon.id);
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }
            },
          },
        ]
      );
    } else {
      handleIAPPurchase(`addon_${addon.id}`);
    }
  }, [inventory.coins, spendCoins, purchaseInstrumentAddon, handleIAPPurchase]);

  const handleBuyBundle = useCallback((bundle: ShopBundle) => {
    handleIAPPurchase(`bundle_${bundle.id}`);
  }, [handleIAPPurchase]);

  const handleRestorePurchases = useCallback(async () => {
    await restorePurchases();
  }, [restorePurchases]);

  const handleStartTrial = useCallback(() => {
    const success = startFreeTrial();
    if (success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('🎉 Trial Started!', 'Enjoy 7 days of premium features for free!');
    }
  }, [startFreeTrial]);

  const tabs: { key: ShopTab; label: string; icon: React.ReactElement }[] = [
    { key: 'featured', label: 'Featured', icon: <Star size={16} /> },
    { key: 'themes', label: 'Themes', icon: <Paintbrush size={16} /> },
    { key: 'skins', label: 'Skins', icon: <Palette size={16} /> },
    { key: 'cosmetics', label: 'Cosmetics', icon: <Award size={16} /> },
    { key: 'powerups', label: 'Power-ups', icon: <Shield size={16} /> },
    { key: 'learning', label: 'Learning', icon: <BookOpen size={16} /> },
    { key: 'instruments', label: 'Instruments', icon: <Guitar size={16} /> },
    { key: 'coins', label: 'Coins', icon: <Coins size={16} /> },
    { key: 'premium', label: 'Premium', icon: <Crown size={16} /> },
  ];

  const getPackagePrice = (identifier: string): string => {
    const pkg = getPackageByIdentifier(identifier);
    if (pkg?.product.priceString) return pkg.product.priceString;
    return getMockPrice(identifier);
  };

  const featuredBundles = useMemo(() => getFeaturedBundles(), []);

  const monthlyPrice = 4.99;
  const yearlyPrice = 39.99;
  const savings = calculateSavings(monthlyPrice, yearlyPrice);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            ) : (
              <RotateCcw size={18} color={Colors.textSecondary} />
            )}
          </TouchableOpacity>
          <View style={styles.balanceRow}>
            <Coins size={18} color="#FFD700" />
            <Text style={styles.balanceText}>{inventory.coins}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabScrollView}
        contentContainerStyle={styles.tabContainer}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
          >
            {React.cloneElement(tab.icon as React.ReactElement<{ color: string }>, { 
              color: selectedTab === tab.key ? Colors.background : Colors.textSecondary 
            })}
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isPurchasesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>Loading store...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {isTrialActive && !isPremium && selectedTab === 'premium' && (
            <TrialBanner 
              daysRemaining={trialDaysRemaining} 
              onUpgrade={() => setSelectedPlan('yearly')} 
            />
          )}

          {selectedTab === 'featured' && (
            <View>
              <Text style={styles.sectionTitle}>🔥 Featured Bundles</Text>
              <Text style={styles.sectionSubtitle}>Best value packs with exclusive savings</Text>
              
              {featuredBundles.map(bundle => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  isOwned={inventory.ownedBundles?.includes(bundle.id) || false}
                  onBuy={() => handleBuyBundle(bundle)}
                />
              ))}

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🎁 All Bundles</Text>
              {SHOP_BUNDLES.filter(b => !b.featured).map(bundle => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  isOwned={inventory.ownedBundles?.includes(bundle.id) || false}
                  onBuy={() => handleBuyBundle(bundle)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'themes' && (
            <View>
              <Text style={styles.sectionTitle}>🎨 Color Themes</Text>
              <Text style={styles.sectionSubtitle}>Customize your app look</Text>
              
              {COLOR_THEMES.map(theme => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isOwned={inventory.ownedThemes?.includes(theme.id) || false}
                  isEquipped={inventory.equippedTheme === theme.id}
                  onBuy={() => handleBuyTheme(theme.id, theme.price)}
                  onEquip={() => handleEquipTheme(theme.id)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'skins' && (
            <View>
              <Text style={styles.sectionTitle}>🎹 Keyboard Skins</Text>
              <Text style={styles.sectionSubtitle}>Personalize your piano</Text>
              
              {KEYBOARD_SKINS.map(skin => (
                <SkinPreview
                  key={skin.id}
                  skin={skin}
                  isOwned={inventory.ownedSkins.includes(skin.id)}
                  isEquipped={inventory.equippedSkin === skin.id}
                  onBuy={() => handleBuySkin(skin.id, skin.price || 500)}
                  onEquip={() => handleEquipSkin(skin.id)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'cosmetics' && (
            <View>
              <Text style={styles.sectionTitle}>✨ Cosmetics</Text>
              <Text style={styles.sectionSubtitle}>Badges, frames, titles & more</Text>
              
              <View style={styles.cosmeticsGrid}>
                {COSMETIC_ITEMS.map(item => (
                  <CosmeticCard
                    key={item.id}
                    item={item}
                    isOwned={inventory.ownedCosmetics?.includes(item.id) || false}
                    onBuy={() => handleBuyCosmetic(item)}
                  />
                ))}
              </View>
            </View>
          )}

          {selectedTab === 'powerups' && (
            <View>
              <Text style={styles.sectionTitle}>⚡ Power-ups</Text>
              <Text style={styles.sectionSubtitle}>Boost your gameplay</Text>
              
              {POWER_UPS.map(powerUp => (
                <PowerUpCard
                  key={powerUp.id}
                  powerUp={powerUp}
                  owned={inventory.ownedPowerUps?.[powerUp.id] || 0}
                  onBuy={() => handleBuyPowerUp(powerUp)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'learning' && (
            <View>
              <Text style={styles.sectionTitle}>📚 Learning Packs</Text>
              <Text style={styles.sectionSubtitle}>Master music with AI-powered lessons</Text>
              
              {LEARNING_PACKS.map(pack => (
                <LearningPackCard
                  key={pack.id}
                  pack={pack}
                  isOwned={inventory.ownedLearningPacks?.includes(pack.id) || false}
                  onBuy={() => handleBuyLearningPack(pack)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'instruments' && (
            <View>
              <Text style={styles.sectionTitle}>🎸 Instrument Add-ons</Text>
              <Text style={styles.sectionSubtitle}>Sound packs & visual effects</Text>
              
              {INSTRUMENT_ADDONS.map(addon => (
                <InstrumentAddonCard
                  key={addon.id}
                  addon={addon}
                  isOwned={inventory.ownedInstrumentAddons?.includes(addon.id) || false}
                  onBuy={() => handleBuyInstrumentAddon(addon)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'coins' && (
            <View>
              <Text style={styles.sectionTitle}>💰 Coin Packs</Text>
              <Text style={styles.sectionSubtitle}>Get coins for shop purchases</Text>
              
              <View style={styles.coinCards}>
                <TouchableOpacity 
                  style={styles.coinCard}
                  onPress={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_500, 'coins', 500)}
                  disabled={isPurchasing}
                >
                  <Text style={styles.coinIcon}>💰</Text>
                  <Text style={styles.coinAmount}>500</Text>
                  <Text style={styles.coinLabel}>Coins</Text>
                  <Text style={styles.coinPrice}>{getPackagePrice(PACKAGE_IDENTIFIERS.COINS_500)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.coinCard, styles.coinCardPopular]}
                  onPress={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_1500, 'coins', 1500)}
                  disabled={isPurchasing}
                >
                  <View style={styles.coinCardBadge}>
                    <Text style={styles.coinCardBadgeText}>+20%</Text>
                  </View>
                  <Text style={styles.coinIcon}>💰</Text>
                  <Text style={styles.coinAmount}>1,500</Text>
                  <Text style={styles.coinLabel}>Coins</Text>
                  <Text style={styles.coinPrice}>{getPackagePrice(PACKAGE_IDENTIFIERS.COINS_1500)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.coinCard, styles.coinCardBest]}
                  onPress={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_5000, 'coins', 5000)}
                  disabled={isPurchasing}
                >
                  <View style={[styles.coinCardBadge, styles.coinCardBadgeBest]}>
                    <Text style={styles.coinCardBadgeText}>+50%</Text>
                  </View>
                  <Text style={styles.coinIcon}>💎</Text>
                  <Text style={styles.coinAmount}>5,000</Text>
                  <Text style={styles.coinLabel}>Coins</Text>
                  <Text style={styles.coinPrice}>{getPackagePrice(PACKAGE_IDENTIFIERS.COINS_5000)}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>💡 Hint Packs</Text>
              
              <View style={styles.hintCards}>
                <TouchableOpacity 
                  style={styles.hintCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log('[Shop] Hint purchase tapped: 5 hints');
                    handleIAPPurchase(PACKAGE_IDENTIFIERS.HINTS_SMALL, 'hints', 5);
                  }}
                  disabled={purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_SMALL}
                >
                  {purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_SMALL ? (
                    <ActivityIndicator size="small" color={Colors.accent} style={{ marginBottom: 8 }} />
                  ) : (
                    <Text style={styles.hintIcon}>💡</Text>
                  )}
                  <Text style={styles.hintAmount}>5 Hints</Text>
                  <Text style={styles.hintPrice}>{getPackagePrice(PACKAGE_IDENTIFIERS.HINTS_SMALL)}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.hintCard, styles.hintCardBest]}
                  activeOpacity={0.7}
                  onPress={() => {
                    console.log('[Shop] Hint purchase tapped: 50 hints');
                    handleIAPPurchase(PACKAGE_IDENTIFIERS.HINTS_LARGE, 'hints', 50);
                  }}
                  disabled={purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_LARGE}
                >
                  <View style={styles.hintCardBadge}>
                    <Text style={styles.hintCardBadgeText}>BEST VALUE</Text>
                  </View>
                  {purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_LARGE ? (
                    <ActivityIndicator size="small" color={Colors.accent} style={{ marginBottom: 8 }} />
                  ) : (
                    <Text style={styles.hintIcon}>🌟</Text>
                  )}
                  <Text style={styles.hintAmount}>50 Hints</Text>
                  <Text style={styles.hintPrice}>{getPackagePrice(PACKAGE_IDENTIFIERS.HINTS_LARGE)}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedTab === 'premium' && (
            <View style={styles.premiumSection}>
              {isPremium ? (
                <View style={styles.premiumActiveCard}>
                  <Crown size={48} color="#FFD700" />
                  <Text style={styles.premiumActiveTitle}>You are Premium!</Text>
                  <Text style={styles.premiumActiveDesc}>
                    Enjoy all premium benefits including ad-free gameplay, unlimited practice, and exclusive features.
                  </Text>
                  <View style={styles.premiumBenefitsList}>
                    {['Ad-free forever', 'All instruments unlocked', 'Exclusive skins', 'Advanced lessons', 'Priority support'].map((benefit, idx) => (
                      <View key={idx} style={styles.benefitItem}>
                        <Star size={16} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={styles.premiumCard}>
                  <Crown size={48} color="#FFD700" />
                  <Text style={styles.premiumTitle}>Melodyx Premium</Text>

                  {!hasUsedTrial && (
                    <TouchableOpacity style={styles.freeTrialBanner} onPress={handleStartTrial}>
                      <Gift size={18} color="#000" />
                      <Text style={styles.freeTrialText}>Start 7-Day Free Trial</Text>
                    </TouchableOpacity>
                  )}

                  <View style={styles.planSelector}>
                    <TouchableOpacity
                      style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionActive]}
                      onPress={() => setSelectedPlan('monthly')}
                    >
                      <Text style={[styles.planOptionTitle, selectedPlan === 'monthly' && styles.planOptionTitleActive]}>Monthly</Text>
                      <Text style={[styles.planOptionPrice, selectedPlan === 'monthly' && styles.planOptionPriceActive]}>{getPackagePrice(PACKAGE_IDENTIFIERS.MONTHLY)}/mo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionActive]}
                      onPress={() => setSelectedPlan('yearly')}
                    >
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsBadgeText}>Save {savings}%</Text>
                      </View>
                      <Text style={[styles.planOptionTitle, selectedPlan === 'yearly' && styles.planOptionTitleActive]}>Yearly</Text>
                      <Text style={[styles.planOptionPrice, selectedPlan === 'yearly' && styles.planOptionPriceActive]}>{getPackagePrice(PACKAGE_IDENTIFIERS.YEARLY)}/yr</Text>
                      <Text style={styles.planPerMonth}>${(yearlyPrice / 12).toFixed(2)}/mo</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.premiumFeatures}>
                    {['Ad-free experience', 'Unlimited practice mode', 'All instruments unlocked', 'Exclusive keyboard skins', 'Priority access to events', 'Advanced learning lessons'].map((feature, idx) => (
                      <View key={idx} style={styles.featureRow}>
                        <Check size={18} color={Colors.correct} />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.premiumButton, isPurchasing && styles.premiumButtonDisabled]} 
                    onPress={() => handleIAPPurchase(selectedPlan === 'yearly' ? PACKAGE_IDENTIFIERS.YEARLY : PACKAGE_IDENTIFIERS.MONTHLY)}
                    disabled={isPurchasing}
                  >
                    {(purchasingPackage === PACKAGE_IDENTIFIERS.MONTHLY || purchasingPackage === PACKAGE_IDENTIFIERS.YEARLY) ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.premiumButtonText}>
                        {selectedPlan === 'yearly' ? 'Subscribe Yearly' : 'Subscribe Monthly'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.legalText}>
                    Subscription auto-renews {selectedPlan === 'yearly' ? 'annually' : 'monthly'}. Cancel anytime in your app store settings.
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  restoreButton: {
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  balanceText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tabScrollView: {
    maxHeight: 44,
    marginBottom: 12,
  },
  tabContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  cosmeticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  coinCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  coinCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  coinCardPopular: {
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  coinCardBest: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  coinCardBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  coinCardBadgeBest: {
    backgroundColor: '#FFD700',
  },
  coinCardBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  coinIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  coinAmount: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  coinLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  coinPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  hintCards: {
    flexDirection: 'row',
    gap: 12,
  },
  hintCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  hintCardBest: {
    borderWidth: 2,
    borderColor: Colors.correct,
  },
  hintCardBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: Colors.correct,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hintCardBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  hintIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  hintAmount: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  hintPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
  },
  premiumSection: {
    paddingVertical: 20,
  },
  premiumCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  premiumActiveCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.correct,
  },
  premiumActiveTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.correct,
    marginTop: 16,
    marginBottom: 8,
  },
  premiumActiveDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  premiumBenefitsList: {
    width: '100%',
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.text,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  freeTrialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  freeTrialText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000',
  },
  premiumFeatures: {
    width: '100%',
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
  },
  premiumButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  premiumButtonDisabled: {
    opacity: 0.7,
  },
  premiumButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000',
  },
  legalText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  planSelector: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  planOption: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planOptionActive: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700' + '15',
  },
  planOptionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  planOptionTitleActive: {
    color: Colors.text,
  },
  planOptionPrice: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  planOptionPriceActive: {
    color: '#FFD700',
  },
  planPerMonth: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: Colors.correct,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  savingsBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
