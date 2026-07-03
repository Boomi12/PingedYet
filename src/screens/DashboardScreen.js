import React, { useState, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl, 
  Alert, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { STATUSES } from '../constants/statuses';
import { AuthContext } from '../context/AuthContext';
import { applicationService } from '../services/api';
import DashboardCard from '../components/DashboardCard';
import CursorSparkles from '../components/CursorSparkles';
import StatusBadge from '../components/StatusBadge';
import AppLogo from '../components/AppLogo';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function DashboardScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useContext(ThemeContext);
  const { userInfo, signOut } = useContext(AuthContext);

  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    shortlisted: 0,
    assessment: 0,
    interviewAttended: 0,
    selected: 0,
    rejected: 0,
    pending: 0,
    thisMonth: 0,
    successRate: 0,
    rejectionRate: 0,
  });
  
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const loadData = async () => {
    try {
      setIsOffline(false);
      const list = await applicationService.getAll();
      const apps = list || [];
      setApplications(apps);
      calculateStats(apps);
    } catch (error) {
      console.warn('[Dashboard] Data fetch failed:', error.message);
      setIsOffline(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const calculateStats = (list) => {
    const total = list.length;
    const applied = list.filter((app) => app.status === STATUSES.APPLIED).length;
    const shortlisted = list.filter((app) => app.status === STATUSES.SHORTLISTED).length;
    const assessment = list.filter((app) => app.status === STATUSES.ASSESSMENT).length;
    const interviewAttended = list.filter((app) => app.status === STATUSES.INTERVIEW_ATTENDED).length;
    const selected = list.filter((app) => app.status === STATUSES.SELECTED).length;
    const rejected = list.filter((app) => app.status === STATUSES.REJECTED).length;
    const pending = applied + shortlisted + assessment + interviewAttended;

    // Filter this month's count
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = list.filter((app) => {
      if (!app.appliedDate) return false;
      const d = new Date(app.appliedDate);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    // Rates using formula: (Count / Total) * 100
    const successRate = total > 0 ? Math.round((selected / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

    setStats({
      total,
      applied,
      shortlisted,
      assessment,
      interviewAttended,
      selected,
      rejected,
      pending,
      thisMonth,
      successRate,
      rejectionRate,
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleLogout = () => {
    console.log('[Dashboard] User clicked Logout button.');
    
    const performSignOut = async () => {
      console.log('[Dashboard] Confirming logout press. Resetting authentication state.');
      setIsLoggingOut(true);
      try {
        await signOut();
      } catch (err) {
        console.error('[Dashboard] Error during logout trigger:', err);
        if (Platform.OS === 'web') {
          window.alert('Logout Failed: Could not logout. Please try again.');
        } else {
          Alert.alert('Logout Failed', 'Could not logout. Please try again.');
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

  const getUpcomingInterviews = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return applications
      .filter((app) => {
        if (!app.interviewDate) return false;
        const intDate = new Date(app.interviewDate);
        return intDate >= today;
      })
      .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
  };

  const getFollowUpCount = () => {
    const today = new Date();
    return applications.filter((app) => {
      if (!['Applied', 'Shortlisted', 'Assessment'].includes(app.status)) return false;
      const appDate = new Date(app.appliedDate);
      const diffTime = Math.abs(today - appDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 7;
    }).length;
  };

  const upcomingInterviews = getUpcomingInterviews();
  const followUpCount = getFollowUpCount();

  if (isLoggingOut) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Logging out...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
            <AppLogo size={32} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 4 }}>
              <Text style={[styles.brandTextPrimary, { color: colors.textPrimary }]}>Pinged</Text>
              <Text style={[styles.brandTextAccent, { color: colors.cyan }]}>Yet</Text>
            </View>
          </View>
          
          <View style={styles.headerCenter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.welcomeHeaderText, { color: colors.textPrimary }]}>
                {applications.length === 0 ? 'Welcome, ' : 'Welcome back, '}
              </Text>
              <Text style={[styles.welcomeNameAccent, { color: colors.cyan }]}>
                {userInfo?.name?.split(' ')[0] || 'User'} 👋
              </Text>
            </View>
            <Text style={[styles.welcomeSubtitleText, { color: colors.textSecondary }]} numberOfLines={1}>
              {applications.length === 0 
                ? 'Start tracking your applications today.' 
                : 'Track every application. Never miss an opportunity.'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.headerIconBtn, { borderColor: colors.border }]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={isDark ? "weather-sunny" : "weather-night"} 
                size={16} 
                color={colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.headerIconBtn, { borderColor: colors.error + '40', backgroundColor: colors.error + '05' }]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="power" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Offline Alert Bar */}
        {isOffline && (
          <View style={[styles.offlineBar, { backgroundColor: colors.error }]}>
            <MaterialCommunityIcons name="wifi-off" size={16} color="#FFF" />
            <Text style={styles.offlineText}>Could not connect to the server. Please check if the backend is running.</Text>
          </View>
        )}

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.cyan}
              colors={[colors.cyan]}
            />
          }
        >
          {/* Goal & Career Coach Card (Motivating and highly useful replacement for Pulse Monitor) */}
          <View style={[styles.pulseCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <View style={styles.pulseHeader}>
              <View style={styles.pulseTitleRow}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.cyan} style={{ marginRight: 6 }} />
                <Text style={[styles.pulseTitle, { color: colors.textPrimary }]}>Weekly Target & Streak</Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: colors.cyan + '15', borderColor: colors.cyan + '45' }]}>
                <MaterialCommunityIcons name="fire" size={14} color="#FF6D00" style={{ marginRight: 4 }} />
                <Text style={[styles.streakText, { color: colors.cyan }]}>5-Day Streak</Text>
              </View>
            </View>

            {/* Goal Progress Section (Orbital Circular HUD Style) */}
            <View style={styles.orbitalGoalContainer}>
              {/* Left Column: Glowing Orbital Circle */}
              <View style={styles.orbitalLeft}>
                {/* Outer Holographic Ring */}
                <View style={[styles.orbitalOuterRing, { borderColor: colors.cyan + '40' }]}>
                  {/* Dashed Indicator Ring */}
                  <View style={[styles.orbitalDashRing, { borderColor: colors.purple + '80' }]} />
                  {/* Inner Glowing Core */}
                  <View style={[styles.orbitalCore, { backgroundColor: colors.cyan + '12', borderColor: colors.cyan }]}>
                    <MaterialCommunityIcons name="satellite-variant" size={20} color={colors.cyan} />
                  </View>
                </View>
              </View>

              {/* Right Column: Orbit Metrics */}
              <View style={styles.orbitalRight}>
                <View style={styles.orbitalHeaderRow}>
                  <Text style={[styles.orbitalLabel, { color: colors.textSecondary }]}>Weekly Target Orbit</Text>
                  <Text style={[styles.orbitalCount, { color: colors.cyan }]}>
                    {stats.thisMonth > 5 ? 5 : stats.thisMonth} / 5
                  </Text>
                </View>
                
                {/* Horizontal Neon Bar */}
                <View style={[styles.goalBarBg, { backgroundColor: colors.border }]}>
                  <View 
                    style={[
                      styles.goalBarFill, 
                      { 
                        backgroundColor: colors.cyan, 
                        width: `${(stats.thisMonth > 5 ? 5 : stats.thisMonth) * 20}%`,
                        ...Platform.select({
                          web: { boxShadow: `0px 0px 8px ${colors.cyan}` },
                          default: { shadowColor: colors.cyan }
                        })
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.orbitalTelemetryText, { color: colors.textMuted }]}>
                  Scanner online. Submitting {5 - (stats.thisMonth > 5 ? 5 : stats.thisMonth)} more logs will complete the weekly orbit.
                </Text>
              </View>
            </View>

            {/* Career Tip Box */}
            <View style={[styles.tipBox, { backgroundColor: colors.border + '12', borderColor: colors.border }]}>
              <View style={styles.tipHeaderRow}>
                <MaterialCommunityIcons name="lightbulb-on-outline" size={16} color={colors.purple} style={{ marginRight: 6 }} />
                <Text style={[styles.tipTitle, { color: colors.purple }]}>Career Tip of the Day</Text>
              </View>
              <Text style={[styles.tipBody, { color: colors.textSecondary }]}>
                {stats.successRate > 0 
                  ? "Applications with customized follow-up logs have a 35% higher callback rate. Set reminder prompts for your interviews!"
                  : "Keep pushing! Submitting 5 job logs a week triples your matching rate. Remember to log your interview outcomes!"}
              </Text>
            </View>
          </View>

          {/* Quick Actions (Regular Card Style, positioned below Smart Insights) */}
          <View
            style={[
              styles.regularCard, 
              { 
                backgroundColor: colors.cardBg,
                borderColor: colors.border,
                ...Platform.select({
                  web: { boxShadow: `0px 4px 12px ${colors.shadow}` },
                  default: { shadowColor: colors.shadow }
                })
              }
            ]}
          >
            <View style={styles.heroLeft}>
              <Text style={[styles.regularCardTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
              <Text style={[styles.regularCardBody, { color: colors.textSecondary }]}>
                Ready to log a new opportunity? Add it to your tracker here.
              </Text>
              <TouchableOpacity 
                style={styles.heroAddBtnContainer}
                onPress={() => navigation.navigate('Add Application')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cyan, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroAddBtnGradient}
                >
                  <MaterialCommunityIcons name="plus-box" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.heroAddBtnText}>Add New Application</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <View style={styles.heroRight}>
              <MaterialCommunityIcons 
                name={applications.length === 0 ? "gesture-tap-button" : "rocket-launch-outline"} 
                size={38} 
                color={colors.cyan} 
                style={{ opacity: 0.8 }}
              />
            </View>
          </View>

          {/* Upcoming Interviews */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Upcoming Interviews</Text>
          </View>

          {upcomingInterviews.length > 0 ? (
            <View style={[styles.upcomingContainer, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
              {upcomingInterviews.map((app) => (
                <TouchableOpacity
                  key={app.id || app._id}
                  style={[styles.upcomingRow, { borderBottomColor: colors.border }]}
                  onPress={() => navigation.navigate('ApplicationDetails', { id: app.id || app._id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.upcomingLeft}>
                    <View style={[styles.upcomingDot, { backgroundColor: colors.cyan }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.upcomingCompany, { color: colors.textPrimary }]} numberOfLines={1}>{app.companyName}</Text>
                      <Text style={[styles.upcomingRole, { color: colors.textSecondary }]} numberOfLines={1}>{app.role}</Text>
                    </View>
                  </View>
                  <View style={styles.upcomingRight}>
                    <StatusBadge status={app.status} />
                    <View style={styles.upcomingDateRow}>
                      <MaterialCommunityIcons name="calendar" size={13} color={colors.cyan} style={{ marginRight: 4 }} />
                      <Text style={[styles.upcomingDate, { color: colors.cyan }]}>{app.interviewDate}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyStateCompact, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="calendar-blank" size={20} color={colors.textMuted} />
              <Text style={[styles.emptyTextCompact, { color: colors.textMuted }]}>No interviews scheduled yet.</Text>
            </View>
          )}

          {/* Application Summary Grid */}
          <View style={styles.sectionHeaderContainer}>
            <Text style={[styles.sectionHeader, { color: colors.textPrimary }]}>Application Summary</Text>
          </View>
          
          <View style={styles.gridContainer}>
            <DashboardCard 
              title="Total Apps" 
              count={stats.total} 
              iconName="folder-open" 
              color={colors.pink} 
              onPress={() => navigation.navigate('Applications', { filter: 'All' })}
            />
            <DashboardCard 
              title="This Month" 
              count={stats.thisMonth} 
              iconName="calendar-month" 
              color={colors.cyan} 
              onPress={() => navigation.navigate('Applications', { filter: 'All' })}
            />
            <DashboardCard 
              title="Applied" 
              count={stats.applied} 
              iconName="send" 
              color={colors.applied}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.APPLIED })}
            />
            <DashboardCard 
              title="Shortlisted" 
              count={stats.shortlisted} 
              iconName="star" 
              color={colors.shortlisted}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.SHORTLISTED })}
            />
            <DashboardCard 
              title="Assessment" 
              count={stats.assessment} 
              iconName="file-document-edit" 
              color={colors.assessment}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.ASSESSMENT })}
            />
            <DashboardCard 
              title="Interviewed" 
              count={stats.interviewAttended} 
              iconName="video" 
              color={colors.interviewAttended}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.INTERVIEW_ATTENDED })}
            />
            <DashboardCard 
              title="Selected" 
              count={stats.selected} 
              iconName="trophy" 
              color={colors.selected}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.SELECTED })}
            />
            <DashboardCard 
              title="Rejected" 
              count={stats.rejected} 
              iconName="close-circle" 
              color={colors.rejected}
              onPress={() => navigation.navigate('Applications', { filter: STATUSES.REJECTED })}
            />
            <DashboardCard 
              title="Pending" 
              count={stats.pending} 
              iconName="clock-outline" 
              color={colors.applied}
              onPress={() => navigation.navigate('Applications', { filter: 'All' })}
            />
            <DashboardCard 
              title="Success Rate" 
              count={`${stats.successRate}%`} 
              iconName="bullseye-arrow" 
              color={colors.selected}
              onPress={() => navigation.navigate('Profile')}
            />
          </View>

          <View style={{ height: 90 }} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '35%',
  },
  brandTextPrimary: {
    fontSize: 18,
    fontWeight: '950',
    letterSpacing: 0.5,
  },
  brandTextAccent: {
    fontSize: 18,
    fontWeight: '950',
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      web: {
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        backgroundImage: 'linear-gradient(90deg, #00F0FF, #A855F7)',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        textShadow: '0 0 4px rgba(0, 240, 255, 0.15)',
      }
    })
  },
  headerCenter: {
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeHeaderText: {
    fontSize: 15,
    fontWeight: '850',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  welcomeNameAccent: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      web: {
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        backgroundImage: 'linear-gradient(90deg, #00F0FF, #FF007F)',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        textShadow: '0 0 6px rgba(0, 240, 255, 0.2)',
      }
    })
  },
  welcomeSubtitleText: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 6,
    letterSpacing: 1.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '25%',
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 8,
  },
  offlineText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  regularCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  regularCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  regularCardBody: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
    marginBottom: 12,
  },
  heroLeft: {
    flex: 1,
    paddingRight: 10,
  },
  heroAddBtnContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  heroAddBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  heroAddBtnText: {
    color: '#FFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  insightsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  pulseCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  streakText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  orbitalGoalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 16,
  },
  orbitalLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitalOuterRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  orbitalDashRing: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    opacity: 0.6,
  },
  orbitalCore: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitalRight: {
    flex: 1,
  },
  orbitalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orbitalLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  orbitalCount: {
    fontSize: 12,
    fontWeight: '900',
  },
  orbitalTelemetryText: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 13,
  },
  goalBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
  },
  goalBarFill: {
    height: 8,
    borderRadius: 4,
  },
  tipBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipBody: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionHeaderContainer: {
    marginTop: 6,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  upcomingContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  upcomingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  upcomingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  upcomingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  upcomingCompany: {
    fontSize: 14,
    fontWeight: '800',
  },
  upcomingRole: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  upcomingRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 10,
  },
  upcomingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upcomingDate: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyStateCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 20,
  },
  emptyTextCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});
