import React, { useState, useCallback, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../context/ThemeContext';
import { STATUSES, STATUS_LIST } from '../constants/statuses';
import { applicationService } from '../services/api';
import { cancelReminder } from '../services/notificationService';
import StatusBadge from '../components/StatusBadge';
import CursorSparkles from '../components/CursorSparkles';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function ApplicationDetailsScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, isDark } = useContext(ThemeContext);

  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (currentStatus) => {
    switch (currentStatus) {
      case 'Applied': return colors.applied;
      case 'Shortlisted': return colors.shortlisted;
      case 'Assessment': return colors.assessment;
      case 'Interview Attended': return colors.interviewAttended;
      case 'Selected': return colors.selected;
      case 'Rejected': return colors.rejected;
      default: return colors.cyan;
    }
  };

  const loadDetails = async () => {
    try {
      setIsLoading(true);
      const app = await applicationService.getById(id);
      if (app) {
        setApplication(app);
      } else {
        Alert.alert('Error', 'Application not found.');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Retrieval Failure', error.message || 'Failed to fetch application details.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [id])
  );

  const handleUpdateStatus = async (newStatus) => {
    try {
      let notificationId = application?.notificationId;
      // Wipe reminders if outcome is set to Selected or Rejected
      if (['Selected', 'Rejected'].includes(newStatus) && notificationId) {
        await cancelReminder(notificationId);
        notificationId = null;
      }
      
      const updated = await applicationService.update(id, { 
        status: newStatus,
        notificationId 
      });
      setApplication(updated);
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Failed to update status.');
    }
  };

  const handleDelete = () => {
    if (!application?._id) {
      if (Platform.OS === 'web') {
        window.alert('Error: Invalid application data.');
      } else {
        Alert.alert('Error', 'Invalid application data.');
      }
      return;
    }

    console.log('[Frontend] Invoking handleDelete for _id:', application._id);

    const performDelete = async () => {
      setIsDeleting(true);
      try {
        // 1. Cancel local reminder notifications
        if (application?.notificationId) {
          await cancelReminder(application.notificationId);
        }
        
        // 2. Request backend delete via application._id
        await applicationService.delete(application._id);
        console.log('[Frontend] Delete success for _id:', application._id);
        
        if (Platform.OS === 'web') {
          window.alert('Success: Application deleted successfully.');
        } else {
          Alert.alert('Success', 'Application deleted successfully.');
        }
        
        // 3. Navigate back to Applications screen and trigger updates
        navigation.navigate('MainTabs', { screen: 'Applications' });
      } catch (error) {
        console.error('[Frontend] Delete failed for _id:', application._id, error.message);
        if (Platform.OS === 'web') {
          window.alert(`Delete Failed: ${error.message || 'Failed to delete application.'}`);
        } else {
          Alert.alert('Delete Failed', error.message || 'Failed to delete application.');
        }
      } finally {
        setIsDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Are you sure you want to permanently delete the application for ${application?.companyName}?`);
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Application',
        `Are you sure you want to permanently delete the application for ${application?.companyName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const getDaysSinceApplied = (dateString) => {
    if (!dateString) return '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appDate = new Date(dateString);
      appDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - appDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Applied today';
      if (diffDays === 1) return 'Applied 1 day ago';
      return `Applied ${diffDays} days ago`;
    } catch {
      return '';
    }
  };

  // Timeline render component with dynamic branching
  const renderTimeline = () => {
    const stages = [
      { name: 'Applied', icon: 'send', statusVal: 'Applied' },
      { name: 'Shortlisted', icon: 'star', statusVal: 'Shortlisted' },
      { name: 'Assessment', icon: 'file-document-edit', statusVal: 'Assessment' },
      { name: 'Interview Attended', icon: 'video', statusVal: 'Interview Attended' },
      { 
        name: application.status === 'Rejected' ? 'Rejected' : (application.status === 'Selected' ? 'Selected' : 'Outcome'),
        icon: application.status === 'Selected' ? 'trophy' : (application.status === 'Rejected' ? 'close-circle' : 'help-circle-outline'),
        statusVal: application.status === 'Selected' || application.status === 'Rejected' ? application.status : 'Outcome' 
      }
    ];

    let activeStageIndex = 0;
    if (application.status === 'Shortlisted') activeStageIndex = 1;
    else if (application.status === 'Assessment') activeStageIndex = 2;
    else if (application.status === 'Interview Attended') activeStageIndex = 3;
    else if (application.status === 'Selected' || application.status === 'Rejected') activeStageIndex = 4;

    return (
      <View style={[styles.timelineCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <Text style={[styles.timelineCardTitle, { color: colors.textPrimary }]}>Status Timeline</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineScroll}>
          {stages.map((stage, index) => {
            const isCompleted = index < activeStageIndex || (index === 4 && (application.status === 'Selected' || application.status === 'Rejected'));
            const isActive = index === activeStageIndex;
            
            let nodeColor = colors.textMuted;
            if (isCompleted || isActive) {
              nodeColor = application.status === 'Rejected' ? colors.rejected : (application.status === 'Selected' ? colors.selected : colors.cyan);
            }

            return (
              <View key={stage.name} style={styles.timelineNodeContainer}>
                {/* Connecting Line Connector */}
                {index > 0 && (
                  <View 
                    style={[
                      styles.timelineLine, 
                      { 
                        backgroundColor: index <= activeStageIndex ? colors.cyan : colors.border,
                        shadowColor: index <= activeStageIndex ? colors.cyan : 'transparent',
                        shadowOpacity: index <= activeStageIndex ? 0.4 : 0,
                        shadowRadius: 5,
                      }
                    ]} 
                  />
                )}

                {/* Node bubble */}
                <TouchableOpacity
                  style={[
                    styles.nodeBubble,
                    { 
                      borderColor: nodeColor,
                      backgroundColor: isActive ? nodeColor + '18' : (isCompleted ? nodeColor + '0A' : colors.cardBg)
                    },
                    isActive && {
                      shadowColor: nodeColor,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: 0.8,
                      shadowRadius: 8,
                      elevation: 6,
                    }
                  ]}
                  onPress={() => {
                    if (stage.statusVal === 'Outcome') {
                      Alert.alert(
                        'Set Outcome',
                        'Choose the final status for this application:',
                        [
                          { text: 'Selected (Hired! 🎉)', onPress: () => handleUpdateStatus('Selected') },
                          { text: 'Rejected (Closed) 🛑', onPress: () => handleUpdateStatus('Rejected') },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    } else {
                      handleUpdateStatus(stage.statusVal);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={stage.icon} 
                    size={16} 
                    color={isCompleted || isActive ? nodeColor : colors.textMuted} 
                  />
                </TouchableOpacity>

                <Text 
                  style={[
                    styles.nodeLabel, 
                    { color: isCompleted || isActive ? colors.textPrimary : colors.textMuted },
                    isActive && { color: nodeColor, fontWeight: '800' }
                  ]}
                >
                  {stage.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {(application.status === 'Selected' || application.status === 'Rejected') && (
          <TouchableOpacity 
            style={[styles.resetStatusBtn, { borderColor: colors.border, backgroundColor: colors.border + '15' }]}
            onPress={() => handleUpdateStatus('Interview Attended')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="undo-variant" size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.resetStatusBtnText, { color: colors.textSecondary }]}>Revert to Interview Attended</Text>
          </TouchableOpacity>
        )}
        
        <Text style={[styles.timelineHelpText, { color: colors.textMuted }]}>
          💡 Tap stage icon to update progress. Outcome node toggles Selected vs Rejected.
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading details...</Text>
      </SafeAreaView>
    );
  }

  if (!application) return null;

  const currentStatusColor = getStatusColor(application.status);

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Application Info</Text>
          <TouchableOpacity style={styles.deleteButtonHeader} onPress={handleDelete} disabled={isDeleting}>
            <MaterialCommunityIcons name="trash-can-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main Info Hero */}
          <View style={[
            styles.heroCard, 
            { 
              backgroundColor: colors.cardBg, 
              borderColor: colors.border,
              ...Platform.select({
                web: { boxShadow: `0px 6px 12px ${colors.shadow}` },
                default: { shadowColor: colors.shadow }
              })
            }
          ]}>
            <View style={styles.heroHeader}>
              <View style={[styles.avatar, { backgroundColor: currentStatusColor + '12', borderColor: currentStatusColor + '40' }]}>
                <Text style={[styles.avatarText, { color: currentStatusColor }]}>
                  {application.companyName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.heroTextContainer}>
                <Text style={[styles.companyNameText, { color: colors.textPrimary }]} numberOfLines={1}>{application.companyName}</Text>
                <Text style={[styles.roleText, { color: colors.textSecondary }]} numberOfLines={1}>{application.role}</Text>
              </View>
            </View>

            <View style={styles.badgeRow}>
              <StatusBadge status={application.status} />
              {application.appliedDate && (
                <View style={[styles.daysBadge, { backgroundColor: colors.border }]}>
                  <Text style={[styles.daysText, { color: colors.textSecondary }]}>
                    {getDaysSinceApplied(application.appliedDate)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Timeline Tracker */}
          {renderTimeline()}

          {/* Details list */}
          <View style={[
            styles.detailsCard, 
            { 
              backgroundColor: colors.cardBg, 
              borderColor: colors.border,
              ...Platform.select({
                web: { boxShadow: `0px 6px 12px ${colors.shadow}` },
                default: { shadowColor: colors.shadow }
              })
            }
          ]}>
            <Text style={[styles.detailsCardTitle, { color: colors.textPrimary }]}>Application Summary</Text>

            {/* Company Name */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="office-building" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Company</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.companyName}
              </Text>
            </View>

            {/* Role / Position */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="briefcase-outline" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Role</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.role}
              </Text>
            </View>

            {/* Platform */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="web" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Platform</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.platform || 'Direct / Other'}
              </Text>
            </View>

            {/* Status */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="tag-outline" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
              </View>
              <Text style={[styles.detailValue, { color: currentStatusColor, fontWeight: '800' }]}>
                {application.status}
              </Text>
            </View>

            {/* Work Mode */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="briefcase-clock" size={18} color={colors.purple} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Work Mode</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.workMode || 'Not specified'}
              </Text>
            </View>

            {/* Work Location */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Work Location</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.workLocation || 'Not specified'}
              </Text>
            </View>

            {/* Stipend / Salary / Fee */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="cash-multiple" size={18} color={colors.success} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Stipend / Salary / Fee</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.stipendAmount !== null && application.stipendAmount !== undefined
                  ? Number(application.stipendAmount).toLocaleString()
                  : 'Not specified'}
              </Text>
            </View>

            {/* Duration */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Duration</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.duration || 'Not specified'}
              </Text>
            </View>

            {/* Applied Date */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="calendar-import" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Applied Date</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{application.appliedDate}</Text>
            </View>

            {/* Interview Date */}
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <View style={styles.detailRowLeft}>
                <MaterialCommunityIcons name="calendar-check" size={18} color={colors.cyan} />
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Interview Date</Text>
              </View>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {application.interviewDate || 'Not scheduled yet'}
              </Text>
            </View>

            {/* Reminder Status */}
            {application.interviewDate && (
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <View style={styles.detailRowLeft}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.purple} />
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Reminder Status</Text>
                </View>
                <Text style={[styles.detailValue, { color: application.notificationId ? colors.success : colors.textMuted, fontWeight: '700' }]}>
                  {application.notificationId ? 'Active Reminder' : 'No Reminder Set'}
                </Text>
              </View>
            )}

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <MaterialCommunityIcons name="notebook-outline" size={18} color={colors.cyan} />
                <Text style={[styles.notesTitle, { color: colors.textSecondary }]}>Notes</Text>
              </View>
              {application.notes ? (
                <Text style={[styles.notesContent, { color: colors.textPrimary }]}>{application.notes}</Text>
              ) : (
                <View style={styles.emptyNotes}>
                  <MaterialCommunityIcons name="text-box-remove-outline" size={22} color={colors.textMuted} />
                  <Text style={[styles.emptyNotesText, { color: colors.textMuted }]}>No notes provided for this application.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.editButtonContainer}
              onPress={() => navigation.navigate('EditApplication', { id })}
              disabled={isDeleting}
            >
              <LinearGradient
                colors={[colors.cyan, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGradient}
              >
                <MaterialCommunityIcons name="pencil" size={18} color="#FFF" style={{ marginRight: 6 }} />
                <Text style={styles.actionBtnText}>Edit Application</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.deleteButton, 
                { borderColor: colors.error + '50', backgroundColor: colors.error + '08' }
              ]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <View style={styles.loaderRow}>
                  <ActivityIndicator size="small" color={colors.error} style={{ marginRight: 8 }} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>Deleting...</Text>
                </View>
              ) : (
                <>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.deleteBtnText, { color: colors.error }]}>Delete Application</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
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
    fontWeight: '700',
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  deleteButtonHeader: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  heroTextContainer: {
    flex: 1,
  },
  companyNameText: {
    fontSize: 22,
    fontWeight: '900',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  daysBadge: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  daysText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Timeline styles
  timelineCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  timelineCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  timelineScroll: {
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  timelineNodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    marginRight: 28,
  },
  timelineLine: {
    position: 'absolute',
    left: -28,
    right: 0,
    width: 28,
    height: 2.5,
    top: 15,
    zIndex: -1,
  },
  nodeBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
    alignSelf: 'center',
  },
  resetStatusBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineHelpText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },
  // Details card
  detailsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  detailsCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  notesSection: {
    marginTop: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  emptyNotes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  emptyNotesText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  editButtonContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    height: 48,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    height: 48,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
