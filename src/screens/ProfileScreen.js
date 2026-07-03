import React, { useContext, useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { applicationService } from '../services/api';
import { STATUSES } from '../constants/statuses';
import { getNotificationPreference, setNotificationPreference, requestNotificationPermission } from '../services/notificationService';
import CursorSparkles from '../components/CursorSparkles';
import AppLogo from '../components/AppLogo';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function ProfileScreen() {
  const { theme, colors, isDark, toggleTheme } = useContext(ThemeContext);
  const { userInfo, signOut } = useContext(AuthContext);
  
  const [stats, setStats] = useState({
    total: 0,
    selected: 0,
    rejected: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  // Load user notification preferences
  useEffect(() => {
    const loadRemindersPref = async () => {
      const pref = await getNotificationPreference();
      setRemindersEnabled(pref);
    };
    loadRemindersPref();
  }, []);

  const loadProfileStats = async () => {
    try {
      setIsLoading(true);
      const list = await applicationService.getAll();
      const total = list.length;
      let selected = 0;
      let rejected = 0;

      list.forEach((app) => {
        if (app.status === STATUSES.SELECTED) selected++;
        else if (app.status === STATUSES.REJECTED) rejected++;
      });

      // Calculate Success Rate: (Selected / Total) * 100
      const successRate = total > 0 ? Math.round((selected / total) * 100) : 0;

      setStats({
        total,
        selected,
        rejected,
        successRate
      });
    } catch (e) {
      console.error('[ProfileScreen] Failed to load stats:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfileStats();
    }, [])
  );

  const handleToggleReminders = async (val) => {
    setRemindersEnabled(val);
    await setNotificationPreference(val);
    if (val) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permissions Required',
          'Notification permissions are required on this device to schedule interview reminders. Please enable them in your device settings.',
          [{ text: 'OK' }]
        );
        setRemindersEnabled(false);
        await setNotificationPreference(false);
      }
    }
  };

  const handleLogout = () => {
    console.log('[Profile] User triggered logout.');
    
    const performSignOut = async () => {
      console.log('[Profile] Logout confirmed. Clearing credentials and routing to Login.');
      setIsLoggingOut(true);
      try {
        await signOut();
      } catch (err) {
        console.error('[Profile] Error signing out:', err);
        if (Platform.OS === 'web') {
          window.alert('Logout Failed: Could not logout. Please try again.');
        } else {
          Alert.alert('Error', 'Could not logout. Please try again.');
        }
      } finally {
        setIsLoggingOut(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to log out of PingedYet?');
      if (confirmLogout) {
        performSignOut();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to log out of PingedYet?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performSignOut }
        ]
      );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (isLoggingOut) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Logging out...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <CursorSparkles />
      
      <LinearGradient 
        colors={colors.bgGradient} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <BackgroundBubbles />
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <AppLogo size={38} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.brandTextPrimary, { color: colors.textPrimary }]}>Pinged</Text>
              <Text style={[styles.brandTextAccent, { color: colors.cyan }]}>Yet</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.headerIconBtn, { borderColor: colors.border }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isDark ? "weather-sunny" : "weather-night"} 
                size={18} 
                color={colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerIconBtn, { borderColor: colors.error + '40', backgroundColor: colors.error + '05' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="power" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          <View style={[
            styles.identityCard, 
            { 
              backgroundColor: colors.cardBg, 
              borderColor: colors.border,
              ...Platform.select({
                web: {
                  boxShadow: `0px 6px 8px ${colors.shadow}`
                },
                default: {
                  shadowColor: colors.shadow
                }
              })
            }
          ]}>
            <View style={[styles.userAvatar, { borderColor: colors.border }]}>
              <LinearGradient
                colors={[colors.cyan, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.userAvatarText}>
                  {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'B'}
                </Text>
              </LinearGradient>
            </View>
            <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userInfo?.name || 'Developer Name'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userInfo?.email || 'developer@example.com'}</Text>
            <Text style={[styles.createdDate, { color: colors.textMuted }]}>
              Member Since: {formatDate(userInfo?.createdAt)}
            </Text>
          </View>

          {/* My Progress */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>My Progress</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.cyan} style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.statsGrid}>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#FFFFFF' }]}>
                  <Text style={[styles.statValue, { color: colors.cyan }]}>{stats.total}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Apps</Text>
                </View>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#FFFFFF' }]}>
                  <Text style={[styles.statValue, { color: colors.selected }]}>{stats.selected}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Selected</Text>
                </View>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#FFFFFF' }]}>
                  <Text style={[styles.statValue, { color: colors.rejected }]}>{stats.rejected}</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Rejected</Text>
                </View>
                <View style={[styles.statBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : '#FFFFFF' }]}>
                  <Text style={[styles.statValue, { color: colors.purple }]}>{stats.successRate}%</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Success Rate</Text>
                </View>
              </View>
            )}
          </View>

          {/* App Settings */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>App Settings</Text>

            {/* Theme Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { borderColor: colors.cyan + '30' }]}>
                  <MaterialCommunityIcons name="theme-light-dark" size={20} color={colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Light Theme</Text>
                  <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>Toggle light/dark visual mode</Text>
                </View>
              </View>
              <Switch
                value={!isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: colors.cyan + '40' }}
                thumbColor={!isDark ? colors.cyan : '#f4f3f4'}
              />
            </View>

            <View style={[styles.settingDivider, { backgroundColor: colors.border }]} />

            {/* Interview Reminders Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { borderColor: colors.purple + '30' }]}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={20} color={colors.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabelText, { color: colors.textPrimary }]}>Interview Reminders</Text>
                  <Text style={[styles.settingSubtext, { color: colors.textMuted }]}>Get notified before upcoming interviews.</Text>
                </View>
              </View>
              <Switch
                value={remindersEnabled}
                onValueChange={handleToggleReminders}
                trackColor={{ false: '#767577', true: colors.purple + '40' }}
                thumbColor={remindersEnabled ? colors.purple : '#f4f3f4'}
              />
            </View>
          </View>

          {/* Account / Logout Section */}
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Account Actions</Text>
            
            <TouchableOpacity 
              style={[styles.logoutBtn, { borderColor: colors.error + '40', backgroundColor: colors.error + '05' }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="logout" size={18} color={colors.error} style={{ marginRight: 8 }} />
              <Text style={[styles.logoutBtnText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Branding Info */}
          <View style={styles.brandingBox}>
            <Text style={[styles.appName, { color: colors.cyan }]}>PingedYet</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
              Track every application. Never miss an opportunity.
            </Text>
            <Text style={[styles.versionText, { color: colors.textMuted }]}>Version 2.2.0</Text>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextPrimary: {
    fontSize: 22,
    fontWeight: '950',
    letterSpacing: 0.5,
  },
  brandTextAccent: {
    fontSize: 22,
    fontWeight: '950',
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(6, 182, 212, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: 'rgba(6, 182, 212, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      web: {
        textShadow: '0 0 6px rgba(6, 182, 212, 0.4)',
      }
    })
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  identityCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      }
    })
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  brandLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  brandNameText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  userAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: 14,
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '950',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  createdDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statBox: {
    width: '47%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingDivider: {
    height: 1,
    marginVertical: 12,
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSubtext: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  brandingBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  appName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  appTagline: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  versionText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
