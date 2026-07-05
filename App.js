import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [particles, setParticles] = useState([]);
  const particleId = useRef(0);

  const spawnParticles = (x, y) => {
    if (Platform.OS === 'web') return;

    const newParticles = [];
    // Spawn 3 particles per touch event
    for (let i = 0; i < 3; i++) {
      particleId.current += 1;
      newParticles.push({
        id: particleId.current,
        x,
        y,
        size: Math.random() * 6 + 4, // 4px to 10px random sizes
        color: Math.random() > 0.5 ? '#00F0FF' : '#A855F7', // neon cyan or purple
        animX: new Animated.Value(0),
        animY: new Animated.Value(0),
        opacity: new Animated.Value(1),
      });
    }

    setParticles(prev => [...prev, ...newParticles].slice(-30)); // Limit to 30 active particles for performance

    newParticles.forEach(p => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 25 + 10;
      const targetX = Math.cos(angle) * distance;
      const targetY = Math.sin(angle) * distance;

      Animated.parallel([
        Animated.timing(p.animX, {
          toValue: targetX,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(p.animY, {
          toValue: targetY,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Clean up when animation finishes
        setParticles(prev => prev.filter(item => item.id !== p.id));
      });
    });
  };

  const handleTouchStart = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    spawnParticles(pageX, pageY);
  };

  const handleTouchMove = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    spawnParticles(pageX, pageY);
  };

  const linking = {
    prefixes: [],
    config: {
      screens: {
        Login: 'login',
        Register: 'register',
        MainTabs: {
          path: '',
          screens: {
            Dashboard: 'dashboard',
            Applications: 'applications',
            'Add Application': 'add',
            Profile: 'profile',
          },
        },
        ApplicationDetails: 'application/:id',
        EditApplication: 'edit/:id',
      },
    },
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <View 
            style={{ flex: 1 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <NavigationContainer linking={linking}>
              <AppNavigator />
            </NavigationContainer>

            {/* Global touch sparkles layer */}
            {Platform.OS !== 'web' && particles.length > 0 && (
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                {particles.map(p => (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: 'absolute',
                      left: p.x - p.size / 2,
                      top: p.y - p.size / 2,
                      width: p.size,
                      height: p.size,
                      borderRadius: p.size / 2,
                      backgroundColor: p.color,
                      opacity: p.opacity,
                      transform: [
                        { translateX: p.animX },
                        { translateY: p.animY },
                      ],
                      shadowColor: p.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 3,
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

