import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DatePickerInput({ label, value, onChange, error, colors, isDark }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          try {
            e.target.showPicker();
          } catch (err) {}
        }}
        style={{
          color: isDark ? '#F8FAFC' : '#0F172A',
          borderColor: error ? '#EF4444' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#D0E1FD'),
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
          borderWidth: '1.5px',
          borderStyle: 'solid',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'inherit',
          fontWeight: '600',
          padding: '10px 14px',
          height: '48px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
      {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}
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
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  }
});
