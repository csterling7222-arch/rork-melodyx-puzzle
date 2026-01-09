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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Coins, Palette, Lightbulb, Crown, Check, RotateCcw, Sparkles, Star, Tag
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { usePurchases, PACKAGE_IDENTIFIERS } from '@/contexts/PurchasesContext';
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
    isConfigured,
    getPackageByIdentifier,
    getMockPrice,
    calculateSavings,
    applyPromoCode,
  } = usePurchases();
  
  const [selectedTab, setSelectedTab] = useState<'skins' | 'hints' | 'coins' | 'premium'>('skins');
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

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
      Alert.alert('Store Unavailable', 'Products are loading. Please try again in a moment.');
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
          Alert.alert(
            '🎉 Purchase Complete!', 
            `You received ${rewardAmount} coins! Your balance has been updated.`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        } else if (rewardType === 'hints' && rewardAmount) {
          addHints(rewardAmount);
          Alert.alert(
            '💡 Hints Added!', 
            `You received ${rewardAmount} hints! Use them wisely.`,
            [{ text: 'Great!', style: 'default' }]
          );
        } else if (packageId === PACKAGE_IDENTIFIERS.MONTHLY || packageId === '$rc_monthly') {
          Alert.alert(
            '👑 Welcome to Premium!', 
            'Enjoy ad-free gameplay, unlimited practice, exclusive skins, and all premium features!',
            [{ text: 'Let\'s Go!', style: 'default' }]
          );
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
    if (pkg?.product.priceString) return pkg.product.priceString;
    return getMockPrice(identifier);
  };

  const handleApplyPromo = useCallback(async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    const result = await applyPromoCode(promoCode.trim());
    setPromoResult(result);
    setIsApplyingPromo(false);
    if (result.success && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [promoCode, applyPromoCode]);

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
                price={getPackagePrice(PACKAGE_IDENTIFIERS.HINTS_SMALL)}
                rarity="common"
                onPurchase={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.HINTS_SMALL, 'hints', 5)}
                isLoading={purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_SMALL}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="🌟"
                name="50 Hints Pack"
                description="Get 50 hints - best value!"
                price={getPackagePrice(PACKAGE_IDENTIFIERS.HINTS_LARGE)}
                rarity="rare"
                onPurchase={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.HINTS_LARGE, 'hints', 50)}
                isLoading={purchasingPackage === PACKAGE_IDENTIFIERS.HINTS_LARGE}
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
                price={getPackagePrice(PACKAGE_IDENTIFIERS.COINS_500)}
                rarity="common"
                onPurchase={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_500, 'coins', 500)}
                isLoading={purchasingPackage === PACKAGE_IDENTIFIERS.COINS_500}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="💰"
                name="1500 Coins"
                description="Value pack with +20% bonus"
                price={getPackagePrice(PACKAGE_IDENTIFIERS.COINS_1500)}
                rarity="rare"
                onPurchase={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_1500, 'coins', 1500)}
                isLoading={purchasingPackage === PACKAGE_IDENTIFIERS.COINS_1500}
                disabled={isPurchasing}
              />
              <IAPItemCard
                icon="💎"
                name="5000 Coins"
                description="Premium pack with +50% bonus"
                price={getPackagePrice(PACKAGE_IDENTIFIERS.COINS_5000)}
                rarity="epic"
                onPurchase={() => handleIAPPurchase(PACKAGE_IDENTIFIERS.COINS_5000, 'coins', 5000)}
                isLoading={purchasingPackage === PACKAGE_IDENTIFIERS.COINS_5000}
                disabled={isPurchasing}
              />
            </View>
          )}

          {selectedTab === 'premium' && (
            <View style={styles.premiumSection}>
              {isPremium ? (
                <View style={styles.premiumActiveCard}>
                  <View style={styles.premiumActiveIconContainer}>
                    <Crown size={48} color="#FFD700" />
                    <Sparkles size={20} color="#FFD700" style={styles.sparkleIcon} />
                  </View>
                  <Text style={styles.premiumActiveTitle}>You&apos;re Premium!</Text>
                  <Text style={styles.premiumActiveDesc}>
                    Enjoy all premium benefits including ad-free gameplay, unlimited practice, and exclusive features.
                  </Text>
                  <View style={styles.premiumBenefitsList}>
                    <View style={styles.benefitItem}>
                      <Star size={16} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.benefitText}>Ad-free forever</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Star size={16} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.benefitText}>All instruments unlocked</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Star size={16} color="#FFD700" fill="#FFD700" />
                      <Text style={styles.benefitText}>Exclusive skins access</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.premiumCard}>
                  <Crown size={48} color="#FFD700" />
                  <Text style={styles.premiumTitle}>Melodyx Premium</Text>
                  {!isConfigured && (
                    <View style={styles.sandboxBadge}>
                      <Text style={styles.sandboxText}>SANDBOX MODE</Text>
                    </View>
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
                      <Text style={styles.featureText}>All instruments unlocked</Text>
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

                  <View style={styles.promoCodeSection}>
                    <View style={styles.promoInputRow}>
                      <Tag size={18} color={Colors.textSecondary} />
                      <TextInput
                        style={styles.promoInput}
                        placeholder="Promo code"
                        placeholderTextColor={Colors.textMuted}
                        value={promoCode}
                        onChangeText={setPromoCode}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={[styles.promoApplyButton, (!promoCode.trim() || isApplyingPromo) && styles.promoApplyButtonDisabled]}
                        onPress={handleApplyPromo}
                        disabled={!promoCode.trim() || isApplyingPromo}
                      >
                        {isApplyingPromo ? (
                          <ActivityIndicator size="small" color={Colors.text} />
                        ) : (
                          <Text style={styles.promoApplyText}>Apply</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {promoResult && (
                      <Text style={[styles.promoResultText, promoResult.success ? styles.promoSuccess : styles.promoError]}>
                        {promoResult.message}
                      </Text>
                    )}
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
    marginBottom: 16,
  },
  premiumActiveIconContainer: {
    position: 'relative',
  },
  sparkleIcon: {
    position: 'absolute',
    top: -8,
    right: -12,
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
  premiumBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    backgroundColor: Colors.correct,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.5,
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
  sandboxBadge: {
    backgroundColor: '#FF6B35' + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  sandboxText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FF6B35',
    letterSpacing: 0.5,
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
  promoCodeSection: {
    width: '100%',
    marginBottom: 16,
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  promoInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 12,
  },
  promoApplyButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  promoApplyButtonDisabled: {
    opacity: 0.5,
  },
  promoApplyText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  promoResultText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  promoSuccess: {
    color: Colors.correct,
  },
  promoError: {
    color: '#EF4444',
  },
});
