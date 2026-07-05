import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ApplicationListScreen from '../screens/ApplicationListScreen';
import AddApplicationScreen from '../screens/AddApplicationScreen';
import ApplicationDetailsScreen from '../screens/ApplicationDetailsScreen';
import EditApplicationScreen from '../screens/EditApplicationScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  const { colors, isDark } = useContext(ThemeContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.cyan,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.2,
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#0A0C13' : '#FFFFFF',
          borderTopWidth: 1.5,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          // Light neon cyan top glow for futuristic styling
          shadowColor: colors.cyan,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Applications') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Add Application') {
            iconName = focused ? 'plus-circle' : 'plus-circle-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return (
            <MaterialCommunityIcons 
              name={iconName} 
              size={size + 2} 
              color={color} 
              style={focused && {
                textShadowColor: color + '80',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              }}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Applications" component={ApplicationListScreen} />
      <Tab.Screen name="Add Application" component={AddApplicationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isLoading, userToken } = useContext(AuthContext);
  const { colors, isDark } = useContext(ThemeContext);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {userToken == null ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen 
              name="ApplicationDetails" 
              component={ApplicationDetailsScreen} 
              options={{
                animation: 'slide_from_right'
              }}
            />
            <Stack.Screen 
              name="EditApplication" 
              component={EditApplicationScreen} 
              options={{
                animation: 'slide_from_bottom'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
