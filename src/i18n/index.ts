/**
 * i18n Configuration
 * Internationalization setup with i18next for multi-language support
 * Supports: English, Arabic (RTL), Spanish, French, German
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

// Import translation files
import en from './locales/en.json';
import ar from './locales/ar.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

// Storage key for persisting language preference
export const LANGUAGE_STORAGE_KEY = '@lifetag_language';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false },
  { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false },
] as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

// Translation resources
const resources = {
  en: { translation: en },
  ar: { translation: ar },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
};

/**
 * Get the device's preferred language, falling back to English if not supported
 */
export const getDeviceLanguage = (): LanguageCode => {
  const locales = Localization.getLocales();
  const deviceLocale = locales?.[0]?.languageCode || 'en';
  const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === deviceLocale);
  return isSupported ? (deviceLocale as LanguageCode) : 'en';
};

/**
 * Get stored language preference from AsyncStorage
 */
export const getStoredLanguage = async (): Promise<LanguageCode | null> => {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang && SUPPORTED_LANGUAGES.some(lang => lang.code === storedLang)) {
      return storedLang as LanguageCode;
    }
    return null;
  } catch (error) {
    console.error('Error reading stored language:', error);
    return null;
  }
};

/**
 * Store language preference to AsyncStorage
 */
export const storeLanguage = async (languageCode: LanguageCode): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  } catch (error) {
    console.error('Error storing language:', error);
  }
};

/**
 * Check if a language is RTL
 */
export const isRTLLanguage = (languageCode: LanguageCode): boolean => {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return language?.isRTL || false;
};

/**
 * Apply RTL layout based on language
 * Note: This requires app restart to take full effect
 */
export const applyRTL = (languageCode: LanguageCode): void => {
  const shouldBeRTL = isRTLLanguage(languageCode);
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
  }
};

/**
 * Check if RTL change requires restart
 */
export const requiresRestart = (newLanguage: LanguageCode): boolean => {
  const newIsRTL = isRTLLanguage(newLanguage);
  return I18nManager.isRTL !== newIsRTL;
};

/**
 * Get language info by code
 */
export const getLanguageInfo = (code: LanguageCode) => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

/**
 * Initialize i18n synchronously with device language
 * This runs at module load time to ensure i18n is ready before React renders
 */
const deviceLanguage = getDeviceLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    react: {
      useSuspense: false,
    },
  });

/**
 * Load stored language preference and apply it
 * Call this after app mount to apply user's saved preference
 */
export const loadStoredLanguagePreference = async (): Promise<LanguageCode> => {
  try {
    const storedLanguage = await getStoredLanguage();
    const targetLanguage = storedLanguage || deviceLanguage;
    
    // Only change if different from current
    if (targetLanguage !== i18n.language) {
      await i18n.changeLanguage(targetLanguage);
      applyRTL(targetLanguage);
    }
    
    return targetLanguage as LanguageCode;
  } catch (error) {
    console.error('Error loading stored language:', error);
    return deviceLanguage;
  }
};

export default i18n;
