import { en, TranslationKeys } from './en';
import { es } from './es';
import { fr } from './fr';
import { ja } from './ja';
import { de } from './de';
import { pt } from './pt';
import { it } from './it';
import { ko } from './ko';
import { zh } from './zh';
import { ru } from './ru';
import { Platform, NativeModules } from 'react-native';

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'ja' | 'de' | 'pt' | 'it' | 'ko' | 'zh' | 'ru';

const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  es,
  fr,
  ja,
  de,
  pt,
  it,
  ko,
  zh,
  ru,
};

export const SUPPORTED_LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
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
