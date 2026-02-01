/**
 * LanguageSelector Component
 * Modal picker for selecting app language
 * Displays supported languages with native names and selection indicator
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageCode } from '../../i18n';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  visible,
  onClose,
}) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [isChanging, setIsChanging] = useState(false);

  const handleLanguageSelect = async (languageCode: LanguageCode) => {
    if (languageCode === currentLanguage) {
      onClose();
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(languageCode);
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isChanging}
            >
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('language.selectLanguage')}</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Language List */}
          <ScrollView
            style={styles.languageList}
            contentContainerStyle={styles.languageListContent}
            showsVerticalScrollIndicator={false}
          >
            {supportedLanguages.map((language) => {
              const isSelected = currentLanguage === language.code;
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                  disabled={isChanging}
                  activeOpacity={0.7}
                >
                  <View style={styles.languageInfo}>
                    <Text
                      style={[
                        styles.languageNativeName,
                        isSelected && styles.languageNativeNameSelected,
                      ]}
                    >
                      {language.nativeName}
                    </Text>
                    <Text style={styles.languageName}>
                      {language.name}
                    </Text>
                  </View>
                  
                  {/* RTL indicator for Arabic */}
                  {language.isRTL && (
                    <View style={styles.rtlBadge}>
                      <Text style={styles.rtlBadgeText}>RTL</Text>
                    </View>
                  )}
                  
                  {/* Selection checkmark */}
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={colors.primary.main}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* RTL Notice */}
          <View style={styles.noticeContainer}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.text.tertiary}
            />
            <Text style={styles.noticeText}>
              {t('language.restartRequired')} - Arabic (العربية)
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
    minHeight: 420,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.elevated,
  },
  title: {
    ...typography.h4,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  languageList: {
    flex: 1,
  },
  languageListContent: {
    padding: spacing.lg,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.elevated,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: colors.primary.main,
    backgroundColor: `${colors.primary.main}10`,
  },
  languageInfo: {
    flex: 1,
  },
  languageNativeName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  languageNativeNameSelected: {
    color: colors.primary.main,
  },
  languageName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rtlBadge: {
    backgroundColor: colors.status.info.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  rtlBadgeText: {
    ...typography.caption,
    color: colors.status.info.main,
    fontWeight: '600',
    fontSize: 10,
  },
  checkmark: {
    marginLeft: spacing.sm,
  },
  noticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.elevated,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  noticeText: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default LanguageSelector;
