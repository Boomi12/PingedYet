import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardCard({ title, count, iconName, color, onPress }) {
  const { colors, isDark } = useContext(ThemeContext);

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0', 
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
          shadowOpacity: isDark ? 0.15 : 0.05,
          borderLeftWidth: 3.5,
          borderLeftColor: color,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '12' }]}>
          <MaterialCommunityIcons name={iconName} size={16} color={color} />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.titleText, { color: colors.textSecondary }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[
            styles.countText, 
            { 
              color: colors.textPrimary, 
              textShadowColor: isDark ? color + '20' : 'transparent' 
            }
          ]}>
            {count}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    width: '48.5%', 
    marginBottom: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  countText: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  titleText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  cornerIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderBottomLeftRadius: 6,
    opacity: 0.6,
  },
});
