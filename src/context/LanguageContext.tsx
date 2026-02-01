/**
 * Language Context
 * Provides language state management and persistence for the entire app
 * Handles RTL layout changes and app restart for Arabic language
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import i18n, {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  storeLanguage,
  applyRTL,
  requiresRestart,
  getLanguageInfo,
  loadStoredLanguagePreference,
} from '../i18n';

// Language Context Types
export interface LanguageContextType {
  // Current language state
  currentLanguage: LanguageCode;
  isRTL: boolean;
  isInitialized: boolean;
  
  // Language operations
  changeLanguage: (languageCode: LanguageCode) => Promise<void>;
  
  // Language info
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  getCurrentLanguageInfo: () => typeof SUPPORTED_LANGUAGES[number] | undefined;
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider Props
interface LanguageProviderProps {
  children: ReactNode;
}

/**
 * Language Provider Component
 * Wraps the app to provide language context to all components
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Get initial language from i18n (already initialized synchronously)
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [isRTL, setIsRTL] = useState<boolean>(() => {
    const langInfo = getLanguageInfo((i18n.language as LanguageCode) || 'en');
    return langInfo?.isRTL || false;
  });
  const [isInitialized, setIsInitialized] = useState<boolean>(true); // Already initialized sync

  // Load stored preference on mount (may override device language)
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const storedLanguage = await loadStoredLanguagePreference();
        setCurrentLanguage(storedLanguage);
        const langInfo = getLanguageInfo(storedLanguage);
        setIsRTL(langInfo?.isRTL || false);
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };

    loadPreference();
  }, []);

  /**
   * Change the app language
   * Shows restart prompt if switching to/from RTL language
   */
  const changeLanguage = async (languageCode: LanguageCode): Promise<void> => {
    try {
      // Check if restart is required (RTL change)
      const needsRestart = requiresRestart(languageCode);

      // Update i18n instance
      await i18n.changeLanguage(languageCode);

      // Store preference
      await storeLanguage(languageCode);

      // Update state
      setCurrentLanguage(languageCode);
      const langInfo = getLanguageInfo(languageCode);
      setIsRTL(langInfo?.isRTL || false);

      // Apply RTL settings
      applyRTL(languageCode);

      // If RTL change is needed, prompt for restart
      if (needsRestart) {
        Alert.alert(
          i18n.t('language.restartRequired'),
          i18n.t('language.restartMessage'),
          [
            {
              text: i18n.t('language.restartLater'),
              style: 'cancel',
            },
            {
              text: i18n.t('language.restartNow'),
              onPress: async () => {
                try {
                  await Updates.reloadAsync();
                } catch (error) {
                  console.error('Error reloading app:', error);
                  // Fallback message if reload fails
                  Alert.alert(
                    'Restart Required',
                    'Please close and reopen the app to apply the language change.'
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
      throw error;
    }
  };

  /**
   * Get current language info
   */
  const getCurrentLanguageInfo = () => {
    return getLanguageInfo(currentLanguage);
  };

  const contextValue: LanguageContextType = {
    currentLanguage,
    isRTL,
    isInitialized,
    changeLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    getCurrentLanguageInfo,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Custom hook to use language context
 * Must be used within a LanguageProvider
 */
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
