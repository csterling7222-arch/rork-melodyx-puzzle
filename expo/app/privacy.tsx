import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Shield, FileText, Mic, CreditCard } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import {
  PRIVACY_POLICY_TEXT,
  TERMS_OF_SERVICE_TEXT,
  MICROPHONE_DISCLOSURE,
  PURCHASE_DISCLOSURE,
  SUPPORT_EMAIL,
} from '@/constants/legal';

type TabKey = 'privacy' | 'terms';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('privacy');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'privacy', label: 'Privacy Policy', icon: <Shield size={16} color={activeTab === 'privacy' ? Colors.text : Colors.textMuted} /> },
    { key: 'terms', label: 'Terms of Service', icon: <FileText size={16} color={activeTab === 'terms' ? Colors.text : Colors.textMuted} /> },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="privacy-back-button"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
            testID={`tab-${tab.key}`}
          >
            {tab.icon}
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.disclosureRow}>
          <View style={styles.disclosureCard}>
            <View style={styles.disclosureIcon}>
              <Mic size={18} color={Colors.secondary} />
            </View>
            <View style={styles.disclosureTextWrap}>
              <Text style={styles.disclosureTitle}>Microphone</Text>
              <Text style={styles.disclosureBody}>{MICROPHONE_DISCLOSURE}</Text>
            </View>
          </View>

          <View style={styles.disclosureCard}>
            <View style={[styles.disclosureIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <CreditCard size={18} color={Colors.primary} />
            </View>
            <View style={styles.disclosureTextWrap}>
              <Text style={styles.disclosureTitle}>Purchases</Text>
              <Text style={styles.disclosureBody}>{PURCHASE_DISCLOSURE}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.policyText}>
          {activeTab === 'privacy' ? PRIVACY_POLICY_TEXT : TERMS_OF_SERVICE_TEXT}
        </Text>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: 0.3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  tabActive: {
    backgroundColor: Colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  tabLabelActive: {
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  disclosureRow: {
    gap: 12,
    marginBottom: 4,
  },
  disclosureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  disclosureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  disclosureTextWrap: {
    flex: 1,
    gap: 4,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  disclosureBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 20,
  },
  policyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  contactCard: {
    marginTop: 28,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  contactEmail: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '500' as const,
  },
});
