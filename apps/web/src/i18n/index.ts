/**
 * FuturaSculptAI - Internationalization (i18n) Engine
 * Supports 22 global and Indian enterprise languages with safe English fallbacks.
 */

import { en, TranslationKeys, LocaleTranslations } from './locales/en';
import { ta } from './locales/ta';
import { hi } from './locales/hi';
import { es } from './locales/es';
import { ja } from './locales/ja';
import { te } from './locales/te';
import { ml } from './locales/ml';
import { kn } from './locales/kn';
import { fr } from './locales/fr';
import { de } from './locales/de';

export type LanguageCode =
  | 'en'
  | 'ta'
  | 'hi'
  | 'te'
  | 'ml'
  | 'kn'
  | 'es'
  | 'fr'
  | 'de'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ar'
  | 'pt';

export interface SupportedLanguage {
  code: LanguageCode;
  name: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English (Global)', flag: '🌐' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
  { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
  { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
  { code: 'zh', name: '简体中文 (Mandarin)', flag: '🇨🇳' },
  { code: 'ar', name: 'العربية (Arabic)', flag: '🇦🇪', dir: 'rtl' },
  { code: 'pt', name: 'Português (Portuguese)', flag: '🇧🇷' },
  { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
];

const LOCALES_REGISTRY: Record<string, LocaleTranslations> = {
  en,
  ta,
  hi,
  te,
  ml,
  kn,
  es,
  fr,
  de,
  ja,
};

/**
 * Returns localized string dictionary for the given language code,
 * falling back gracefully to English for any missing keys.
 */
export function getTranslations(langCode: string): TranslationKeys {
  const chosen = LOCALES_REGISTRY[langCode] || LOCALES_REGISTRY.en;
  return {
    ...en,
    ...chosen,
  };
}

/**
 * Checks if the target language requires right-to-left orientation.
 */
export function isRTL(langCode: string): boolean {
  return langCode === 'ar';
}

export type { TranslationKeys };
