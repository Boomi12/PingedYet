import React, { useContext } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

export default function BackgroundBubbles() {
  const { colors, isDark } = useContext(ThemeContext);

  if (!isDark) return null; // Ambient glowing orbs are optimized for the dark cyberpunk theme

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Soft Giant Bokeh Orbs (Background ambient lighting) */}
      <View 
        style={[
          styles.orb, 
          { 
            top: '-10%', 
            left: '-15%', 
            width: 260, 
            height: 260, 
            borderRadius: 130, 
            backgroundColor: colors.cyan + '18',
            ...Platform.select({
              web: { filter: 'blur(80px)' },
              default: { opacity: 0.4 }
            })
          }
        ]} 
      />
      <View 
        style={[
          styles.orb, 
          { 
            bottom: '-15%', 
            right: '-20%', 
            width: 320, 
            height: 320, 
            borderRadius: 160, 
            backgroundColor: colors.pink + '14',
            ...Platform.select({
              web: { filter: 'blur(100px)' },
              default: { opacity: 0.3 }
            })
          }
        ]} 
      />
      <View 
        style={[
          styles.orb, 
          { 
            top: '40%', 
            right: '-15%', 
            width: 200, 
            height: 200, 
            borderRadius: 100, 
            backgroundColor: colors.purple + '15',
            ...Platform.select({
              web: { filter: 'blur(75px)' },
              default: { opacity: 0.35 }
            })
          }
        ]} 
      />
      <View 
        style={[
          styles.orb, 
          { 
            top: '65%', 
            left: '-10%', 
            width: 180, 
            height: 180, 
            borderRadius: 90, 
            backgroundColor: colors.cyan + '12',
            ...Platform.select({
              web: { filter: 'blur(70px)' },
              default: { opacity: 0.3 }
            })
          }
        ]} 
      />

      {/* Tiny Glowing Cyber Stars (Scattered specs) */}
      <View style={[styles.starSpec, { top: '15%', left: '20%', backgroundColor: colors.cyan }]} />
      <View style={[styles.starSpec, { top: '35%', left: '85%', backgroundColor: colors.pink }]} />
      <View style={[styles.starSpec, { top: '55%', left: '10%', backgroundColor: colors.purple }]} />
      <View style={[styles.starSpec, { top: '78%', left: '75%', backgroundColor: colors.cyan }]} />
      <View style={[styles.starSpec, { top: '92%', left: '40%', backgroundColor: colors.pink }]} />
      <View style={[styles.starSpec, { top: '25%', left: '50%', backgroundColor: colors.purple, width: 3, height: 3, borderRadius: 1.5 }]} />
      <View style={[styles.starSpec, { top: '70%', left: '30%', backgroundColor: colors.cyan, width: 3, height: 3, borderRadius: 1.5 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    // Fallback for native shadow glow
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 50,
      },
      android: {
        elevation: 8,
      }
    })
  },
  starSpec: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.8,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)',
      }
    })
  }
});
