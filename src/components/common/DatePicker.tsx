/**
 * DatePicker Component
 * User-friendly date picker with proper platform support
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

interface DatePickerProps {
  value?: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  style?: any;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = 'Select date of birth',
  label,
  required = false,
  error,
  style,
}) => {
  // Helper function to safely convert value to Date
  const getValidDate = (val: Date | null | undefined): Date | null => {
    console.log('🗓️ DatePicker: Converting value to date:', val, 'Type:', typeof val);
    
    if (!val) return null;
    
    // If it's already a Date object and valid
    if (val instanceof Date && !isNaN(val.getTime())) {
      console.log('✅ DatePicker: Valid Date object:', val);
      return val;
    }
    
    // If it's a Firestore timestamp object with seconds/nanoseconds
    if (typeof val === 'object' && 'seconds' in val) {
      try {
        const date = new Date((val as any).seconds * 1000);
        console.log('🔥 DatePicker: Converted Firestore timestamp:', date);
        return date;
      } catch {
        console.log('❌ DatePicker: Failed to convert Firestore timestamp');
        return null;
      }
    }
    
    // If it's a string, try to parse it
    if (typeof val === 'string') {
      try {
        const parsed = new Date(val);
        console.log('📝 DatePicker: Parsed string date:', parsed);
        return !isNaN(parsed.getTime()) ? parsed : null;
      } catch {
        console.log('❌ DatePicker: Failed to parse string date');
        return null;
      }
    }
    
    // If it's an object with timestamp properties, try to convert
    if (typeof val === 'object') {
      try {
        console.log('🔍 DatePicker: Object keys:', Object.keys(val));
        
        // Handle various timestamp formats
        if ('_seconds' in val) {
          const date = new Date((val as any)._seconds * 1000);
          console.log('🔥 DatePicker: Converted _seconds timestamp:', date);
          return date;
        }
        if ('toDate' in val && typeof (val as any).toDate === 'function') {
          const date = (val as any).toDate();
          console.log('🔥 DatePicker: Used toDate() method:', date);
          return date;
        }
        
        console.log('❌ DatePicker: Unknown object format, returning null');
        return null;
      } catch {
        console.log('❌ DatePicker: Failed to convert object');
        return null;
      }
    }
    
    console.log('❌ DatePicker: Unhandled value type, returning null');
    return null;
  };

  const validDate = getValidDate(value);
  
  const [showPicker, setShowPicker] = useState(false);
  const [tempDay, setTempDay] = useState<number>(validDate?.getDate() || 15);
  const [tempMonth, setTempMonth] = useState<number>(validDate?.getMonth() || 0);
  const [tempYear, setTempYear] = useState<number>(validDate?.getFullYear() || new Date().getFullYear() - 25);

  const currentYear = new Date().getFullYear();
  const minYear = 1900;
  const maxYear = currentYear;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    
    const validDate = getValidDate(date);
    if (!validDate) return '';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return validDate.toLocaleDateString('en-US', options);
  };

  const getDaysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateYears = (): number[] => {
    const years: number[] = [];
    for (let year = maxYear; year >= minYear; year--) {
      years.push(year);
    }
    return years;
  };

  const generateDays = (): number[] => {
    const daysInMonth = getDaysInMonth(tempMonth, tempYear);
    const days: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const handleDateConfirm = () => {
    const newDate = new Date(tempYear, tempMonth, tempDay);
    onDateChange(newDate);
    setShowPicker(false);
  };

  const handleDateCancel = () => {
    const currentValidDate = getValidDate(value);
    if (currentValidDate) {
      setTempDay(currentValidDate.getDate());
      setTempMonth(currentValidDate.getMonth());
      setTempYear(currentValidDate.getFullYear());
    }
    setShowPicker(false);
  };

  const handleClearDate = () => {
    onDateChange(null);
  };

  const openPicker = () => {
    const currentValidDate = getValidDate(value);
    if (currentValidDate) {
      setTempDay(currentValidDate.getDate());
      setTempMonth(currentValidDate.getMonth());
      setTempYear(currentValidDate.getFullYear());
    } else {
      // Set reasonable defaults for date of birth
      const defaultAge = 25;
      const defaultYear = currentYear - defaultAge;
      setTempYear(defaultYear);
      setTempMonth(0); // January
      setTempDay(15); // Mid-month
    }
    setShowPicker(true);
  };

  const handleMonthChange = (month: number) => {
    setTempMonth(month);
    // Adjust day if it's invalid for the new month
    const daysInMonth = getDaysInMonth(month, tempYear);
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  };

  const handleYearChange = (year: number) => {
    setTempYear(year);
    // Adjust day if it's invalid for the new year (e.g., Feb 29 in non-leap year)
    const daysInMonth = getDaysInMonth(tempMonth, year);
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  };

  const renderPickerSection = (
    title: string,
    items: (string | number)[],
    selectedValue: string | number,
    onSelect: (value: any) => void
  ) => (
    <View style={styles.pickerSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <ScrollView style={styles.scrollPicker} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pickerItem,
              selectedValue === item && styles.selectedItem
            ]}
            onPress={() => onSelect(typeof item === 'string' ? index : item)}
          >
            <Text style={[
              styles.itemText,
              selectedValue === item && styles.selectedItemText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.dateInput,
          error && styles.inputError,
          !validDate && styles.placeholderContainer,
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateText,
          !validDate && styles.placeholderText,
        ]}>
          {validDate ? formatDate(validDate) : placeholder}
        </Text>
        
        <View style={styles.iconContainer}>
          {validDate && (
            <TouchableOpacity
              onPress={handleClearDate}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          <Ionicons 
            name="calendar-outline" 
            size={24} 
            color={error ? '#e74c3c' : '#007AFF'} 
          />
        </View>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleDateCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={handleDateCancel}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={handleDateConfirm}>
                <Text style={styles.confirmButton}>Done</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickersContainer}>
              {renderPickerSection('Month', months, months[tempMonth], handleMonthChange)}
              {renderPickerSection('Day', generateDays(), tempDay, setTempDay)}
              {renderPickerSection('Year', generateYears(), tempYear, handleYearChange)}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  inputContainer: {
    position: 'relative',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  inputError: {
    borderColor: '#e74c3c',
    borderWidth: 1.5,
  },
  placeholderContainer: {
    borderStyle: 'dashed',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
    fontStyle: 'italic',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    marginRight: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    marginTop: 5,
    marginLeft: 5,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  
  // Picker Sections
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 20,
  },
  pickerSection: {
    flex: 1,
    marginHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  scrollPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedItemText: {
    color: '#fff',
    fontWeight: '600',
  },
  picker: {
    height: 200,
  },
});