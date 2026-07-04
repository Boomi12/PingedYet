import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';
import { getNextStatus, STATUSES } from '../constants/statuses';
import { applicationService } from '../services/api';
import { cancelReminder } from '../services/notificationService';

export default function ApplicationCard({ application, onPress, onStatusUpdate, onDeleteRefresh }) {
  const navigation = useNavigation();
  const { colors, isDark } = useContext(ThemeContext);
  const { 
    id, 
    companyName, 
    role, 
    status, 
    appliedDate, 
    interviewDate, 
    platform, 
    notificationId,
    workMode,
    workLocation,
    stipendAmount
  } = application;

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

  const statusColor = getStatusColor(status);
  const nextActions = getNextStatus(status);

  const getDaysSinceApplied = (dateString) => {
    if (!dateString) return '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const appDate = new Date(dateString);
      appDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - appDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Future';
      if (diffDays === 0) return 'Today';
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleQuickAction = (newStatus) => {
    if (onStatusUpdate) {
      onStatusUpdate(id, newStatus);
    }
  };

  const handleDelete = () => {
    const targetId = application._id || id;
    
    const performDelete = async () => {
      try {
        if (notificationId) {
          await cancelReminder(notificationId);
        }
        await applicationService.delete(targetId);
        if (Platform.OS === 'web') {
          window.alert('Success: Application deleted successfully.');
        } else {
          Alert.alert('Success', 'Application deleted successfully.');
        }
        if (onDeleteRefresh) {
          onDeleteRefresh();
        }
      } catch (e) {
        if (Platform.OS === 'web') {
          window.alert(`Delete Failed: ${e.message || 'Unable to delete application.'}`);
        } else {
          Alert.alert('Delete Failed', e.message || 'Unable to delete application.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmDelete = window.confirm(`Are you sure you want to permanently delete the application for ${companyName}?`);
      if (confirmDelete) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Delete Application',
        `Are you sure you want to permanently delete the application for ${companyName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          borderColor: isDark ? statusColor + '1F' : colors.border,
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
        }
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top Profile & Meta Section */}
      <View style={styles.cardHeader}>
        {/* Avatar circle */}
        <LinearGradient
          colors={[colors.cyan + '40', colors.purple + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarCircle}
        >
          <Text style={[styles.avatarText, { textShadowColor: colors.cyan + '80' }]}>
            {companyName ? companyName.charAt(0).toUpperCase() : 'C'}
          </Text>
        </LinearGradient>

        {/* Company & Role */}
        <View style={styles.titleContainer}>
          <Text style={[styles.companyText, { color: colors.textPrimary }]} numberOfLines={1}>
            {companyName}
          </Text>
          <Text style={[styles.roleText, { color: colors.textSecondary }]} numberOfLines={1}>
            {role}
          </Text>
          <Text style={[styles.platformText, { color: colors.textMuted }]} numberOfLines={1}>
            Platform: {platform || 'Direct/Other'}
          </Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity 
            style={[styles.actionIconBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} 
            onPress={() => navigation.navigate('EditApplication', { id })}
          >
            <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.cyan} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionIconBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} 
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Badges for Work Mode, Location, and Stipend */}
      {(workMode || workLocation || (stipendAmount !== undefined && stipendAmount !== null && stipendAmount !== '')) ? (
        <View style={styles.badgesContainer}>
          {workMode ? (
            <View style={[styles.metaBadge, { backgroundColor: colors.purple + '12', borderColor: colors.purple + '30' }]}>
              <MaterialCommunityIcons name="briefcase-clock" size={11} color={colors.purple} />
              <Text style={[styles.metaBadgeText, { color: colors.purple }]}>{workMode}</Text>
            </View>
          ) : null}
          {workLocation ? (
            <View style={[styles.metaBadge, { backgroundColor: colors.cyan + '12', borderColor: colors.cyan + '30' }]}>
              <MaterialCommunityIcons name="map-marker-outline" size={11} color={colors.cyan} />
              <Text style={[styles.metaBadgeText, { color: colors.cyan }]} numberOfLines={1}>{workLocation}</Text>
            </View>
          ) : null}
          {(stipendAmount !== undefined && stipendAmount !== null && stipendAmount !== '') ? (
            <View style={[styles.metaBadge, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}>
              <MaterialCommunityIcons name="cash-multiple" size={11} color={colors.success} />
              <Text style={[styles.metaBadgeText, { color: colors.success }]}>
                {Number(stipendAmount).toLocaleString()}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Dates & Elapsed Counter */}
      <View style={[styles.datesContainer, { borderColor: colors.border }]}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-check" size={14} color={colors.textMuted} />
          <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Applied:</Text>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(appliedDate)}</Text>
          <View style={[styles.elapsedBadge, { backgroundColor: colors.cyan + '15' }]}>
            <Text style={[styles.elapsedText, { color: colors.cyan }]}>{getDaysSinceApplied(appliedDate)}</Text>
          </View>
        </View>
        
        {interviewDate ? (
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.dateLabel, { color: colors.textMuted }]}>Interview:</Text>
            <Text style={[styles.dateText, { color: colors.cyan }]}>{formatDate(interviewDate)}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom Status Badge & Quick Progression */}
      <View style={styles.bottomSection}>
        <StatusBadge status={status} />

        {nextActions.length > 0 && (
          <View style={styles.actionButtonsContainer}>
            {nextActions.map((nextStatus) => {
              const buttonColor = getStatusColor(nextStatus);
              const isReject = nextStatus === STATUSES.REJECTED;
              
              return (
                <TouchableOpacity
                  key={nextStatus}
                  style={[
                    styles.actionButton,
                    { 
                      borderColor: buttonColor + '40', 
                      backgroundColor: buttonColor + '0A' 
                    }
                  ]}
                  onPress={() => handleQuickAction(nextStatus)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={isReject ? 'close-circle-outline' : 'arrow-right-circle-outline'} 
                    size={13} 
                    color={buttonColor} 
                    style={{ marginRight: 3 }}
                  />
                  <Text style={[styles.actionButtonText, { color: buttonColor }]}>
                    {nextStatus === STATUSES.INTERVIEW_ATTENDED ? 'Interviewed' : nextStatus}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '950',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 6,
  },
  companyText: {
    fontSize: 16,
    fontWeight: '800',
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  // Badges container styles
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  datesContainer: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'column',
    gap: 6,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 11,
    marginLeft: 4,
    marginRight: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  elapsedBadge: {
    borderRadius: 6,
    paddingVertical: 1,
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  elapsedText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.2,
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
