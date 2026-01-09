import React, { useState, useCallback } from 'react';
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
  Coins, Palette, Lightbulb, Crown, Check, RotateCcw
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { usePurchases } from '@/contexts/PurchasesContext';
import { KEYBOARD_SKINS, KeyboardSkin } from '@/constants/shop';

function SkinPreview({ skin, isOwned, isEquipped, onBuy, onEquip }: { 
  skin: KeyboardSkin; 
  isOwned: boolean;
  isEquipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}) {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  
  return (
    <View style={[styles.skinCard, isEquipped && styles.skinCardEquipped]}>
      <View style={styles.skinHeader}>
        <Text style={styles.skinIcon}>{skin.icon}</Text>
        <View style={styles.skinInfo}>
          <Text style={styles.skinName}>{skin.name}</Text>
          <Text style={styles.skinPreviewText}>{skin.preview}</Text>
        </View>
        {isEquipped && (
          <View style={styles.equippedBadge}>
            <Check size={12} color={Colors.correct} />
          </View>
        )}
      </View>
      
      <View style={styles.skinPreview}>
        {notes.map(note => (
          <View 
            key={note}
            style={[
              styles.previewKey,
              { backgroundColor: skin.colors[note] }
            ]}
          >
            <Text style={[styles.previewKeyText, { color: skin.textColors[note] }]}>
              {note}
            </Text>
          </View>
        ))}
      </View>

      {!isOwned ? (
        <TouchableOpacity style={styles.buyButton} onPress={onBuy}>
          <Coins size={14} color="#FFD700" />
          <Text style={styles.buyButtonText}>500</Text>
        </TouchableOpacity>
      ) : !isEquipped ? (
        <TouchableOpacity style={styles.equipButton} onPress={onEquip}>
          <Text style={styles.equipButtonText}>Equip</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

interface IAPItemCardProps {
  icon: string;
  name: string;
  description: string;
  price: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  onPurchase: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

function IAPItemCard({ icon, name, description, price, rarity, onPurchase, isLoading, disabled }: IAPItemCardProps) {
  const rarityColors: Record<string, string> = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#A855F7',
    legendary: '#FFD700',
  };

  return (
    <TouchableOpacity 
      style={[styles.itemCard, disabled && styles.itemCardDisabled]}
      onPress={onPurchase}
      disabled={disabled || isLoading}
    >
      <View style={[styles.itemIconBg, { backgroundColor: rarityColors[rarity] + '20' }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={rarityColors[rarity]} />
        ) : (
          <Text style={styles.itemIcon}>{icon}</Text>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{name}</Text>
        <Text style={styles.itemDesc}>{description}</Text>
      </View>
      <View style={styles.itemPriceSection}>
        <View style={[styles.rarityBadge, { backgroundColor: rarityColors[rarity] + '20' }]}>
          <Text style={[styles.rarityText, { color: rarityColors[rarity] }]}>
            {rarity.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.priceTextUsd}>{price}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const { inventory, spendCoins, purchaseSkin, equipSkin, addHints, addCoins, isPremium } = useUser();
  const { 
    purchasePackage, 
    restorePurchases, 
    isPurchasing,
    isRestoring,
    isLoading: isPurchasesLoading,
    getPackageByIdentifier,
  } = usePurchases();
  
  const [selectedTab, setSelectedTab] = useState<'skins' | 'hints' | 'coins' | 'premium'>('skins');
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

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

  const handleIAPPurchase = useCallback(async (packageId: string, rewardType?: 'coins' | 'hints', rewardAmount?: number) => {
    const pkg = getPackageByIdentifier(packageId);
    if (!pkg) {
      Alert.alert('Error', 'Product not available. Please try again later.');
      return;
    }

    setPurchasingPackage(packageId);
    const result = await purchasePackage(pkg);
    setPurchasingPackage(null);

    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      if (rewardType === 'coins' && rewardAmount) {
        addCoins(rewardAmount);
        Alert.alert('Success!', `You received ${rewardAmount} coins!`);
      } else if (rewardType === 'hints' && rewardAmount) {
        addHints(rewardAmount);
        Alert.alert('Success!', `You received ${rewardAmount} hints!`);
      } else if (packageId === '$rc_monthly' || packageId === 'monthly') {
        Alert.alert('Welcome to Premium!', 'Enjoy ad-free gameplay, unlimited practice, and exclusive features!');
      }
    } else if (result.error && result.error !== 'cancelled') {
      Alert.alert('Purchase Failed', result.error);
    }
  }, [getPackageByIdentifier, purchasePackage, addCoins, addHints]);

  const handleRestorePurchases = useCallback(async () => {
    await restorePurchases();
  }, [restorePurchases]);

  const tabs = [
    { key: 'skins' as const, label: 'Skins', icon: <Palette size={18} /> },
    { key: 'hints' as const, label: 'Hints', icon: <Lightbulb size={18} /> },
    { key: 'coins' as const, label: 'Coins', icon: <Coins size={18} /> },
    { key: 'premium' as const, label: 'Premium', icon: <Crown size={18} /> },
  ];

  const getPackagePrice = (identifier: string): string => {
    const pkg = getPackageByIdentifier(identifier);
    return pkg?.product.priceString ?? '---';
  };

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

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
          >
            {React.cloneElement(tab.icon, { 
              color: selectedTab === tab.key ? Colors.background : Colors.textSecondary 
            })}
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
          {selectedTab === 'skins' && (
            <View style={styles.skinsGrid}>
              {KEYBOARD_SKINS.map(skin => (
                <SkinPreview
                  key={skin.id}
                  skin={skin}
                  isOwned={inventory.ownedSkins.includes(skin.id)}
                  isEquipped={inventory.equippedSkin === skin.id}
                  onBuy={() => handleBuySkin(skin.id, 500)}
                  onEquip={() => handleEquipSkin(skin.id)}
                />
              ))}
            </View>
          )}

          {selectedTab === 'hints' && (
            <View style={styles.itemsGrid}>
              <IAPItemCard
                icon="💡"
                name="5 Hints Pack"
                description="Get 5 extra hints for tricky puzzles"
                price={getPackagePrice('hints_small')}
                rarity="common"
                onPurchase={() => handleIAPPurchase('hints_small', 'hints', 5)}
                isLoading={purchasingPackage === 'hints_small'}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="🌟"
                name="50 Hints Pack"
                description="Get 50 hints - best value!"
                price={getPackagePrice('hints_large')}
                rarity="rare"
                onPurchase={() => handleIAPPurchase('hints_large', 'hints', 50)}
                isLoading={purchasingPackage === 'hints_large'}
                disabled={isPurchasing}
              />
            </View>
          )}

          {selectedTab === 'coins' && (
            <View style={styles.itemsGrid}>
              <IAPItemCard
                icon="💰"
                name="500 Coins"
                description="Starter coin pack"
                price={getPackagePrice('coins_500')}
                rarity="common"
                onPurchase={() => handleIAPPurchase('coins_500', 'coins', 500)}
                isLoading={purchasingPackage === 'coins_500'}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="💰"
                name="1500 Coins"
                description="Value pack with +20% bonus"
                price={getPackagePrice('coins_1500')}
                rarity="rare"
                onPurchase={() => handleIAPPurchase('coins_1500', 'coins', 1500)}
                isLoading={purchasingPackage === 'coins_1500'}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="💎"
                name="5000 Coins"
                description="Premium pack with +50% bonus"
                price={getPackagePrice('coins_5000')}
                rarity="epic"
                onPurchase={() => handleIAPPurchase('coins_5000', 'coins', 5000)}
                isLoading={purchasingPackage === 'coins_5000'}
                disabled={isPurchasing}
              />
            </View>
          )}

          {selectedTab === 'premium' && (
            <View style={styles.premiumSection}>
              {isPremium ? (
                <View style={styles.premiumActiveCard}>
                  <Crown size={48} color="#FFD700" />
                  <Text style={styles.premiumActiveTitle}>You&apos;re Premium!</Text>
                  <Text style={styles.premiumActiveDesc}>
                    Enjoy all premium benefits including ad-free gameplay and unlimited practice.
                  </Text>
                </View>
              ) : (
                <View style={styles.premiumCard}>
                  <Crown size={48} color="#FFD700" />
                  <Text style={styles.premiumTitle}>Melodyx Premium</Text>
                  <Text style={styles.premiumPrice}>{getPackagePrice('$rc_monthly')}/month</Text>
                  
                  <View style={styles.premiumFeatures}>
                    <View style={styles.featureRow}>
                      <Check size={18} color={Colors.correct} />
                      <Text style={styles.featureText}>Ad-free experience</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Check size={18} color={Colors.correct} />
                      <Text style={styles.featureText}>Unlimited practice mode</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Check size={18} color={Colors.correct} />
                      <Text style={styles.featureText}>Exclusive keyboard skins</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Check size={18} color={Colors.correct} />
                      <Text style={styles.featureText}>Priority access to events</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Check size={18} color={Colors.correct} />
                      <Text style={styles.featureText}>Unlimited melody creation</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.premiumButton, isPurchasing && styles.premiumButtonDisabled]} 
                    onPress={() => handleIAPPurchase('$rc_monthly')}
                    disabled={isPurchasing}
                  >
                    {purchasingPackage === '$rc_monthly' ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={styles.premiumButtonText}>Subscribe Now</Text>
                    )}
                  </TouchableOpacity>

                  <Text style={styles.legalText}>
                    Subscription auto-renews monthly. Cancel anytime in your app store settings.
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontSize: 12,
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
  skinsGrid: {
    gap: 16,
  },
  skinCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
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
  itemsGrid: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  itemCardDisabled: {
    opacity: 0.5,
  },
  itemIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  itemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPriceSection: {
    alignItems: 'flex-end',
    gap: 6,
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
  priceTextUsd: {
    fontSize: 16,
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
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  premiumPrice: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#FFD700',
    marginBottom: 24,
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
});
