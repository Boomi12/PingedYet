import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  Modal, 
  FlatList,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { STATUSES, STATUS_LIST } from '../constants/statuses';
import { applicationService } from '../services/api';
import { scheduleInterviewReminder } from '../services/notificationService';
import CursorSparkles from '../components/CursorSparkles';
import DatePickerInput from '../components/DatePickerInput';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function AddApplicationScreen({ navigation }) {
  const { colors, isDark } = useContext(ThemeContext);

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateToString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [platform, setPlatform] = useState('');
  const [appliedDate, setAppliedDate] = useState(getTodayString());
  const [interviewDate, setInterviewDate] = useState('');
  const [status, setStatus] = useState(STATUSES.APPLIED);
  const [notes, setNotes] = useState('');

  // Native Picker Date Objects
  const [appliedDateObj, setAppliedDateObj] = useState(new Date());
  const [interviewDateObj, setInterviewDateObj] = useState(new Date());

  // UI picker states
  const [showAppliedPicker, setShowAppliedPicker] = useState(false);
  const [showInterviewPicker, setShowInterviewPicker] = useState(false);
  
  // Validation States
  const [companyError, setCompanyError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [appliedDateError, setAppliedDateError] = useState('');
  const [interviewDateError, setInterviewDateError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // UI States
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCompanyName('');
    setRole('');
    setPlatform('');
    setAppliedDate(getTodayString());
    setAppliedDateObj(new Date());
    setInterviewDate('');
    setInterviewDateObj(new Date());
    setStatus(STATUSES.APPLIED);
    setNotes('');
    
    setCompanyError('');
    setRoleError('');
    setAppliedDateError('');
    setInterviewDateError('');
    setGeneralError('');
  };

  const handleSave = async () => {
    setCompanyError('');
    setRoleError('');
    setAppliedDateError('');
    setInterviewDateError('');
    setGeneralError('');

    let hasError = false;

    if (!companyName.trim()) {
      setCompanyError('Company name is required.');
      hasError = true;
    }
    if (!role.trim()) {
      setRoleError('Role / Position is required.');
      hasError = true;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!appliedDate.trim()) {
      setAppliedDateError('Applied date is required.');
      hasError = true;
    } else if (!dateRegex.test(appliedDate)) {
      setAppliedDateError('Applied date must match YYYY-MM-DD.');
      hasError = true;
    }

    if (interviewDate.trim()) {
      if (!dateRegex.test(interviewDate)) {
        setInterviewDateError('Interview date must match YYYY-MM-DD.');
        hasError = true;
      } else if (new Date(interviewDate) < new Date(appliedDate)) {
        setInterviewDateError('Interview date cannot be set before applied date.');
        hasError = true;
      }
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      // 1. Schedule Interview reminder locally if configured
      let generatedNotificationId = null;
      if (interviewDate.trim() && !['Selected', 'Rejected'].includes(status)) {
        generatedNotificationId = await scheduleInterviewReminder(
          companyName.trim(), 
          role.trim(), 
          interviewDate.trim()
        );
      }

      // 2. Create record on DB
      await applicationService.create({
        companyName: companyName.trim(),
        role: role.trim(),
        platform: platform.trim() || 'Direct/Other',
        appliedDate: appliedDate.trim(),
        interviewDate: interviewDate.trim() || null,
        status,
        notes: notes.trim(),
        notificationId: generatedNotificationId,
      });

      resetForm();
      Alert.alert('Success', 'Application saved successfully.');
      navigation.navigate('Applications');
    } catch (error) {
      setGeneralError(error.message || 'Failed to save application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStyleForInput = (inputName, hasValidationError) => {
    return [
      styles.input,
      { 
        color: colors.textPrimary, 
        borderColor: colors.border, 
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
      },
      focusedInput === inputName && { borderColor: colors.cyan },
      hasValidationError && { borderColor: colors.error }
    ];
  };



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
          <Text style={[styles.titleText, { color: colors.textPrimary }]}>Add Application</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {generalError ? (
            <View style={[styles.errorAlert, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
              <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={colors.error} />
              <Text style={[styles.errorAlertText, { color: colors.error }]}>{generalError}</Text>
            </View>
          ) : null}

          <View style={[
            styles.formCard, 
            { 
              backgroundColor: colors.cardBg, 
              borderColor: colors.border, 
              shadowColor: colors.shadow 
            }
          ]}>
            {/* Company Name */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Company Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('company', !!companyError)}
                placeholder="e.g. Google, Stripe"
                placeholderTextColor={colors.textMuted}
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  if (companyError) setCompanyError('');
                }}
                onFocus={() => setFocusedInput('company')}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              {companyError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{companyError}</Text> : null}
            </View>

            {/* Role */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Role / Position *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('role', !!roleError)}
                placeholder="e.g. Software Engineer"
                placeholderTextColor={colors.textMuted}
                value={role}
                onChangeText={(text) => {
                  setRole(text);
                  if (roleError) setRoleError('');
                }}
                onFocus={() => setFocusedInput('role')}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              {roleError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{roleError}</Text> : null}
            </View>

            {/* Platform */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Platform Applied From</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('platform', false)}
                placeholder="e.g. LinkedIn, Job Board"
                placeholderTextColor={colors.textMuted}
                value={platform}
                onChangeText={setPlatform}
                onFocus={() => setFocusedInput('platform')}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
            </View>

            {/* Dates */}
            <View style={styles.row}>
              {/* Applied Date */}
              <View style={styles.halfWidth}>
                <DatePickerInput
                  label="Applied Date *"
                  value={appliedDate}
                  onChange={(val) => {
                    setAppliedDate(val);
                    if (appliedDateError) setAppliedDateError('');
                  }}
                  error={appliedDateError}
                  colors={colors}
                  isDark={isDark}
                />
              </View>

              {/* Interview Date */}
              <View style={styles.halfWidth}>
                <DatePickerInput
                  label="Interview Date"
                  value={interviewDate}
                  onChange={(val) => {
                    setInterviewDate(val);
                    if (interviewDateError) setInterviewDateError('');
                  }}
                  error={interviewDateError}
                  colors={colors}
                  isDark={isDark}
                />
              </View>
            </View>

            {/* Status Selection */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Application Status</Text>
            <TouchableOpacity 
              style={[
                styles.pickerTrigger, 
                { 
                  borderColor: getStatusColor(status) + '40', 
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' 
                }
              ]} 
              onPress={() => !isSubmitting && setIsPickerVisible(true)}
              activeOpacity={0.7}
              disabled={isSubmitting}
            >
              <View style={styles.pickerTriggerContent}>
                <View style={[styles.dotIndicator, { backgroundColor: getStatusColor(status) }]} />
                <Text style={[styles.pickerTriggerText, { color: getStatusColor(status) }]}>{status}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={getStatusColor(status)} />
            </TouchableOpacity>

            {/* Notes */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes & Details</Text>
            <TextInput
              style={[getStyleForInput('notes', false), styles.textArea]}
              placeholder="Add details, contact persons, links, or follow-up plans..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              onFocus={() => setFocusedInput('notes')}
              onBlur={() => setFocusedInput(null)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              keyboardAppearance="dark"
              editable={!isSubmitting}
            />

            {/* Submit */}
            <TouchableOpacity 
              style={styles.submitButtonContainer}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <LinearGradient
                colors={[colors.cyan, colors.purple]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButton}
              >
                {isSubmitting ? (
                  <View style={styles.loaderRow}>
                    <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.submitButtonText}>Saving...</Text>
                  </View>
                ) : (
                  <>
                    <MaterialCommunityIcons name="plus" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitButtonText}>Add Application</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>

      {/* Modal Picker */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Status</Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={STATUS_LIST}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const itemColor = getStatusColor(item);
                const isSelected = status === item;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.modalOption,
                      { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF' },
                      isSelected && { backgroundColor: itemColor + '12', borderColor: itemColor }
                    ]}
                    onPress={() => {
                      setStatus(item);
                      setIsPickerVisible(false);
                    }}
                  >
                    <View style={styles.optionRow}>
                      <View style={[styles.dotIndicator, { backgroundColor: itemColor }]} />
                      <Text style={[styles.optionText, { color: isSelected ? itemColor : colors.textPrimary }]}>
                        {item}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons name="check-bold" size={16} color={itemColor} />
                    )}
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  errorAlertText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  errorLabelText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  halfWidth: {
    width: '48%',
  },
  dateTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 48,
  },
  dateTriggerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 20,
  },
  pickerTriggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  pickerTriggerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 10,
    marginBottom: 24,
  },
  submitButtonContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Modal Picker
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 8, 13, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.5,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalList: {
    padding: 16,
    gap: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // iOS DatePicker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalContainer: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  pickerModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
    gap: 12,
  },
  pickerModalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
