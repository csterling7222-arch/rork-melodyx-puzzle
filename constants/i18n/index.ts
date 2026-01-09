import { en, TranslationKeys } from './en';
import { es } from './es';
import { fr } from './fr';
import { ja } from './ja';
import { de } from './de';
import { Platform, NativeModules } from 'react-native';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ja' | 'de';

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  es,
  fr,
  ja,
  de,
};

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
];

function getDeviceLanguage(): SupportedLanguage {
  try {
    let locale = 'en';
    
    if (Platform.OS === 'ios') {
      locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
               NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
               'en';
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier || 'en';
    } else if (Platform.OS === 'web') {
      locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    }
    
    const languageCode = locale.split(/[-_]/)[0].toLowerCase();
    
    if (languageCode in translations) {
      return languageCode as SupportedLanguage;
    }
    
    return 'en';
  } catch {
    return 'en';
  }
}

let currentLanguage: SupportedLanguage = getDeviceLanguage();

export function setLanguage(lang: SupportedLanguage): void {
  if (lang in translations) {
    currentLanguage = lang;
  }
}

export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

export function t<
  K1 extends keyof TranslationKeys,
  K2 extends keyof TranslationKeys[K1]
>(section: K1, key: K2): string {
  const translation = translations[currentLanguage]?.[section]?.[key];
  const fallback = translations.en[section][key];
  return (translation || fallback) as string;
}

export function getTranslations(): TranslationKeys {
  return translations[currentLanguage] || translations.en;
}

export { TranslationKeys };
