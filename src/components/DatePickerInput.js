import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function DatePickerInput({ label, value, onChange, error, colors, isDark }) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value ? new Date(value) : new Date());

  const formatDateToString = (date) => {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleMobileConfirm = (selectedDate) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(formatDateToString(selectedDate));
    }
  };

  const renderPicker = () => {
    if (!showPicker) return null;

    if (Platform.OS === 'ios') {
      return (
        <Modal transparent visible={showPicker} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="inline"
                onChange={(event, date) => {
                  if (date) setTempDate(date);
                }}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalBtn, { borderColor: colors.border }]} 
                  onPress={() => setShowPicker(false)}
                >
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalBtn, { backgroundColor: colors.cyan }]} 
                  onPress={() => handleMobileConfirm(tempDate)}
                >
                  <Text style={{ color: '#000', fontWeight: '800' }}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <DateTimePicker
        value={value ? new Date(value) : new Date()}
        mode="date"
        display="default"
        onChange={(event, selectedDate) => {
          setShowPicker(false);
          if (selectedDate) {
            onChange(formatDateToString(selectedDate));
          }
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.trigger,
          { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' },
          error && { borderColor: colors.error }
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, { color: value ? colors.textPrimary : colors.textMuted }]}>
          {value || (label.includes('*') ? 'YYYY-MM-DD' : 'Optional')}
        </Text>
        <MaterialCommunityIcons name="calendar" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
      {renderPicker()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
