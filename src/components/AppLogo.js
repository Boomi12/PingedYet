import React, { useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AppLogo({ size = 48 }) {
  const { colors } = useContext(ThemeContext);
  const iconSize = size * 0.55;

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <LinearGradient
        colors={[colors.cyan, colors.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { borderRadius: size * 0.3 }]}
      >
        <MaterialCommunityIcons 
          name="bell-check-outline" 
          size={iconSize} 
          color="#FFF" 
          style={styles.shadowIcon}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00F0FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(0, 240, 255, 0.25)',
      }
    }),
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
