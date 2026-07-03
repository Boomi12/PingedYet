import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [isLoadingTheme, setIsLoadingTheme] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('@pingedyet_theme');
        if (savedTheme) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error('[ThemeContext] Failed to load theme:', error);
      } finally {
        setIsLoadingTheme(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('@pingedyet_theme', newTheme);
    } catch (error) {
      console.error('[ThemeContext] Failed to persist theme:', error);
    }
  };

  const isDark = theme === 'dark';

  // Complete themed colors system
  const colors = {
    // Dynamic background linear gradients (Futuristic Black, Purple, Pink & Blue mix)
    bgGradient: isDark ? ['#020205', '#0E0526', '#24042A', '#06122C'] : ['#F4F9FD', '#E0F2FE'],
    background: isDark ? '#020205' : '#F4F9FD',
    
    // Cards (Glassmorphic semi-transparent cosmic purple-blue)
    cardBg: isDark ? 'rgba(10, 15, 36, 0.5)' : '#FFFFFF',
    border: isDark ? 'rgba(0, 240, 255, 0.15)' : '#D0E1FD', 
    
    // Typography
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#B0C2E8' : '#334155', // Slate-blue secondary text
    textMuted: isDark ? '#7E8EA6' : '#64748B', // Muted blue-grey text
    
    // Brand gradients
    cyan: '#00F0FF', // Neon electric cyan
    purple: '#A855F7', // Electric purple
    pink: '#FF007F', // Neon hot pink
    shadow: isDark ? 'transparent' : 'rgba(15, 23, 42, 0.06)',
    
    // Status Badge Mappings (pastel but highly readable in Light Mode)
    applied: isDark ? '#00F0FF' : '#0284C7',
    shortlisted: isDark ? '#A855F7' : '#6D28D9',
    assessment: isDark ? '#FFB800' : '#B45309',
    interviewAttended: isDark ? '#FF7A00' : '#C2410C',
    selected: isDark ? '#00FFC2' : '#047857',
    rejected: isDark ? '#FF4444' : '#B91C1C',
    
    // System notifications
    error: '#EF4444',
    success: '#10B981',
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, isLoadingTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
