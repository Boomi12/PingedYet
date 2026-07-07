import React, { useState, useEffect, useContext } from 'react';
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
import { scheduleInterviewReminder, cancelReminder } from '../services/notificationService';
import CursorSparkles from '../components/CursorSparkles';
import DatePickerInput from '../components/DatePickerInput';
import BackgroundBubbles from '../components/BackgroundBubbles';

const SUGGESTED_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Developer",
  "Web Developer",
  "React Developer",
  "React Native Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  "UI/UX Designer",
  "Product Designer",
  "QA Tester",
  "Data Analyst",
  "Data Scientist",
  "Machine Learning Intern",
  "AI Intern",
  "DevOps Intern",
  "Cloud Intern",
  "Cybersecurity Intern",
  "WordPress Developer",
  "PHP Developer",
  "Mobile App Developer"
];

const DURATION_SUGGESTIONS = ['3 months', '6 months', 'Full-time', 'Part-time'];

const SUGGESTED_PLATFORMS = [
  "LinkedIn",
  "Internshala",
  "Indeed",
  "Naukri",
  "Wellfound (AngelList)",
  "Glassdoor",
  "Unstop",
  "Direct/Other"
];

export default function EditApplicationScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors, isDark } = useContext(ThemeContext);

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

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState('');
  const [platform, setPlatform] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [status, setStatus] = useState(STATUSES.APPLIED);
  const [notes, setNotes] = useState('');
  const [prevNotificationId, setPrevNotificationId] = useState(null);

  // New Fields State
  const [workMode, setWorkMode] = useState('');
  const [stipendAmount, setStipendAmount] = useState('');
  const [workLocation, setWorkLocation] = useState('');
  const [duration, setDuration] = useState('');

  // Autocomplete suggestions state
  const [mostUsedRoles, setMostUsedRoles] = useState([]);
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [mostUsedPlatforms, setMostUsedPlatforms] = useState([]);
  const [platformSuggestions, setPlatformSuggestions] = useState([]);
  const [showPlatformSuggestions, setShowPlatformSuggestions] = useState(false);

  // Validation States
  const [companyError, setCompanyError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [appliedDateError, setAppliedDateError] = useState('');
  const [interviewDateError, setInterviewDateError] = useState('');
  const [stipendError, setStipendError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // UI States
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Fetch applications list to compute most used roles and platforms, then load specific application
  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Load roles and platforms list
        const list = await applicationService.getAll();
        if (list) {
          const roleCounts = {};
          list.forEach(app => {
            if (app.role) {
              const r = app.role.trim();
              roleCounts[r] = (roleCounts[r] || 0) + 1;
            }
          });
          const sortedRoles = Object.keys(roleCounts).sort((a, b) => roleCounts[b] - roleCounts[a]);
          setMostUsedRoles(sortedRoles);

          const platformCounts = {};
          list.forEach(app => {
            if (app.platform) {
              const p = app.platform.trim();
              if (p !== 'Direct/Other' && p !== '') {
                platformCounts[p] = (platformCounts[p] || 0) + 1;
              }
            }
          });
          const sortedPlatforms = Object.keys(platformCounts).sort((a, b) => platformCounts[b] - platformCounts[a]);
          setMostUsedPlatforms(sortedPlatforms);
        }

        // 2. Load single application
        const app = await applicationService.getById(id);
        if (app) {
          setCompanyName(app.companyName);
          setRole(app.role);
          setPlatform(app.platform || app.platformAppliedFrom || '');
          setAppliedDate(app.appliedDate);
          setInterviewDate(app.interviewDate || '');
          setStatus(app.status);
          setNotes(app.notes || '');
          setPrevNotificationId(app.notificationId || null);
          
          setWorkMode(app.workMode || '');
          setStipendAmount(app.stipendAmount !== null && app.stipendAmount !== undefined ? String(app.stipendAmount) : '');
          setWorkLocation(app.workLocation || '');
          setDuration(app.duration || '');
        } else {
          Alert.alert('System Error', 'Application not found.');
          navigation.goBack();
        }
      } catch (error) {
        Alert.alert('Retrieval Error', error.message || 'Failed to retrieve application details.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleRoleChange = (text) => {
    setRole(text);
    if (roleError) setRoleError('');

    if (text.trim() === '') {
      setRoleSuggestions(mostUsedRoles.slice(0, 5));
    } else {
      const trimmed = text.toLowerCase().trim();

      const keywordMap = {
        'front': ['Frontend Developer'],
        'react': ['React Developer', 'React Native Developer'],
        'node': ['Node.js Developer', 'Backend Developer'],
        'ui': ['UI/UX Designer'],
        'data': ['Data Analyst', 'Data Scientist'],
        'ai': ['AI Intern', 'Machine Learning Intern']
      };

      let matched = [];
      Object.keys(keywordMap).forEach(key => {
        if (trimmed.includes(key)) {
          matched = [...matched, ...keywordMap[key]];
        }
      });

      const combinedList = Array.from(new Set([...mostUsedRoles, ...SUGGESTED_ROLES]));

      combinedList.forEach(r => {
        if (r.toLowerCase().includes(trimmed) && !matched.includes(r)) {
          matched.push(r);
        }
      });

      matched.sort((a, b) => {
        const idxA = mostUsedRoles.indexOf(a);
        const idxB = mostUsedRoles.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });

      setRoleSuggestions(matched);
    }
  };

  const handlePlatformChange = (text) => {
    setPlatform(text);

    if (text.trim() === '') {
      const combined = Array.from(new Set([...mostUsedPlatforms, ...SUGGESTED_PLATFORMS]));
      setPlatformSuggestions(combined.slice(0, 5));
    } else {
      const trimmed = text.toLowerCase().trim();
      const combinedList = Array.from(new Set([...mostUsedPlatforms, ...SUGGESTED_PLATFORMS]));
      const matched = combinedList.filter(p => p.toLowerCase().includes(trimmed));

      matched.sort((a, b) => {
        const idxA = mostUsedPlatforms.indexOf(a);
        const idxB = mostUsedPlatforms.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });

      setPlatformSuggestions(matched);
    }
  };

  const handleUpdate = async () => {
    setCompanyError('');
    setRoleError('');
    setAppliedDateError('');
    setInterviewDateError('');
    setStipendError('');
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
      setAppliedDateError('Date format must be YYYY-MM-DD.');
      hasError = true;
    }

    if (interviewDate.trim()) {
      if (!dateRegex.test(interviewDate)) {
        setInterviewDateError('Date format must be YYYY-MM-DD.');
        hasError = true;
      } else if (new Date(interviewDate) < new Date(appliedDate)) {
        setInterviewDateError('Interview date cannot be before applied date.');
        hasError = true;
      }
    }

    if (stipendAmount.trim()) {
      if (isNaN(Number(stipendAmount))) {
        setStipendError('Stipend / Salary / Fee must be a valid number.');
        hasError = true;
      }
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      // 1. Cancel previous scheduled notification if exists
      if (prevNotificationId) {
        await cancelReminder(prevNotificationId);
      }

      // 2. Schedule new interview notification reminder if interview date is set and status is active
      let newNotificationId = null;
      if (interviewDate.trim() && !['Selected', 'Rejected'].includes(status)) {
        newNotificationId = await scheduleInterviewReminder(
          companyName.trim(), 
          role.trim(), 
          interviewDate.trim()
        );
      }

      // 3. Save updates to DB
      await applicationService.update(id, {
        companyName: companyName.trim(),
        role: role.trim(),
        platform: platform.trim() || 'Direct/Other',
        appliedDate: appliedDate.trim(),
        interviewDate: interviewDate.trim() || null,
        status,
        notes: notes.trim(),
        notificationId: newNotificationId,
        workMode: workMode || null,
        stipendAmount: stipendAmount.trim() !== '' ? Number(stipendAmount) : null,
        workLocation: workLocation.trim(),
        duration: duration.trim(),
      });

      Alert.alert('Success', 'Application saved successfully.');
      navigation.goBack();
    } catch (error) {
      setGeneralError(error.message || 'Failed to update application.');
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.cyan} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading application details...</Text>
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
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            disabled={isSubmitting}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Application</Text>
          <View style={{ width: 40 }} />
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

          {/* Group 1: Basic Details */}
          <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
            <Text style={[styles.sectionTitle, { color: colors.cyan }]}>Basic Details</Text>

            {/* Company Name */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Company Name *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('company', !!companyError)}
                placeholder="e.g. Google"
                placeholderTextColor={colors.textMuted}
                value={companyName}
                onChangeText={(text) => {
                  setCompanyName(text);
                  if (companyError) setCompanyError('');
                }}
                onFocus={() => {
                  setFocusedInput('company');
                  setShowSuggestions(false);
                  setShowPlatformSuggestions(false);
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              {companyError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{companyError}</Text> : null}
            </View>

            {/* Role autocomplete */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Role / Position *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('role', !!roleError)}
                placeholder="e.g. Software Engineer"
                placeholderTextColor={colors.textMuted}
                value={role}
                onChangeText={handleRoleChange}
                onFocus={() => {
                  setFocusedInput('role');
                  setShowSuggestions(true);
                  setShowPlatformSuggestions(false);
                  if (role.trim() === '') {
                    setRoleSuggestions(mostUsedRoles.slice(0, 5));
                  } else {
                    handleRoleChange(role);
                  }
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              {roleError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{roleError}</Text> : null}
            </View>

            {/* Suggestions dropdown list */}
            {showSuggestions && roleSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBg, borderColor: colors.cyan + '40' }]}>
                <ScrollView nestedScrollEnabled style={styles.suggestionsScroll} keyboardShouldPersistTaps="always">
                  {roleSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setRole(item);
                        setRoleError('');
                        setShowSuggestions(false);
                      }}
                    >
                      <MaterialCommunityIcons name="briefcase-outline" size={14} color={colors.cyan} style={{ marginRight: 8 }} />
                      <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{item}</Text>
                      {mostUsedRoles.includes(item) && (
                        <View style={styles.historyBadge}>
                          <MaterialCommunityIcons name="history" size={10} color={colors.purple} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Platform */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Platform Applied From</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('platform', false)}
                placeholder="e.g. LinkedIn"
                placeholderTextColor={colors.textMuted}
                value={platform}
                onChangeText={handlePlatformChange}
                onFocus={() => {
                  setFocusedInput('platform');
                  setShowPlatformSuggestions(true);
                  setShowSuggestions(false);
                  if (platform.trim() === '') {
                    const combined = Array.from(new Set([...mostUsedPlatforms, ...SUGGESTED_PLATFORMS]));
                    setPlatformSuggestions(combined.slice(0, 5));
                  } else {
                    handlePlatformChange(platform);
                  }
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
            </View>

            {/* Platform Suggestions dropdown list */}
            {showPlatformSuggestions && platformSuggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.cardBg, borderColor: colors.cyan + '40' }]}>
                <ScrollView nestedScrollEnabled style={styles.suggestionsScroll} keyboardShouldPersistTaps="always">
                  {platformSuggestions.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setPlatform(item);
                        setShowPlatformSuggestions(false);
                      }}
                    >
                      <MaterialCommunityIcons name="earth" size={14} color={colors.cyan} style={{ marginRight: 8 }} />
                      <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>{item}</Text>
                      {mostUsedPlatforms.includes(item) && (
                        <View style={styles.historyBadge}>
                          <MaterialCommunityIcons name="history" size={10} color={colors.purple} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Group 2: Work Details */}
          <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.cyan }]}>Work Details</Text>

            {/* Work Mode Selector */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Work Mode</Text>
            <View style={styles.workModeRow}>
              {['Work From Home', 'In-Office', 'Hybrid'].map((mode) => {
                const isSelected = workMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.workModeBtn,
                      { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF' },
                      isSelected && { borderColor: colors.cyan, backgroundColor: colors.cyan + '18' }
                    ]}
                    onPress={() => setWorkMode(isSelected ? '' : mode)}
                  >
                    <Text style={[styles.workModeBtnText, { color: isSelected ? colors.cyan : colors.textSecondary }]}>
                      {mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Work Location */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Work Location</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('workLocation', false)}
                placeholder="e.g. Bengaluru, Remote, Mumbai"
                placeholderTextColor={colors.textMuted}
                value={workLocation}
                onChangeText={setWorkLocation}
                onFocus={() => {
                  setFocusedInput('workLocation');
                  setShowSuggestions(false);
                  setShowPlatformSuggestions(false);
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
            </View>

            {/* Stipend Amount */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Stipend / Salary / Fee</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('stipend', !!stipendError)}
                placeholder="Enter amount (e.g. 10000)"
                placeholderTextColor={colors.textMuted}
                value={stipendAmount}
                onChangeText={(text) => {
                  setStipendAmount(text);
                  if (stipendError) setStipendError('');
                }}
                onFocus={() => {
                  setFocusedInput('stipend');
                  setShowSuggestions(false);
                  setShowPlatformSuggestions(false);
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardType="numeric"
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              {stipendError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{stipendError}</Text> : null}
            </View>

            {/* Duration */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Duration</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={getStyleForInput('duration', false)}
                placeholder="e.g. 3 months, 6 months, Full-time"
                placeholderTextColor={colors.textMuted}
                value={duration}
                onChangeText={setDuration}
                onFocus={() => {
                  setFocusedInput('duration');
                  setShowSuggestions(false);
                  setShowPlatformSuggestions(false);
                }}
                onBlur={() => setFocusedInput(null)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />
              
              {/* Duration suggestions chips */}
              <View style={styles.durationSuggestions}>
                {DURATION_SUGGESTIONS.map((sug) => (
                  <TouchableOpacity
                    key={sug}
                    style={[styles.durationChip, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }]}
                    onPress={() => setDuration(sug)}
                  >
                    <Text style={[styles.durationChipText, { color: colors.textSecondary }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Group 3: Dates */}
          <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.cyan }]}>Dates</Text>

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
          </View>

          {/* Group 4: Notes & Details */}
          <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow, marginTop: 20 }]}>
            <Text style={[styles.sectionTitle, { color: colors.cyan }]}>Notes & Details</Text>

            <TextInput
              style={[getStyleForInput('notes', false), styles.textArea]}
              placeholder="Add update notes, interviewer feedback, or next steps..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              onFocus={() => {
                setFocusedInput('notes');
                setShowSuggestions(false);
                setShowPlatformSuggestions(false);
              }}
              onBlur={() => setFocusedInput(null)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              keyboardAppearance="dark"
              editable={!isSubmitting}
            />

            {/* Save Button */}
            <TouchableOpacity 
              style={styles.submitButtonContainer}
              onPress={handleUpdate}
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
                    <MaterialCommunityIcons name="content-save-outline" size={20} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.submitButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 16,
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
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    height: 48,
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
  // Work Mode Selection
  workModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  workModeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Autocomplete Suggestions
  suggestionsContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginTop: -8,
    marginBottom: 16,
    maxHeight: 180,
    overflow: 'hidden',
    zIndex: 10,
  },
  suggestionsScroll: {
    padding: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  historyBadge: {
    padding: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  // Duration Chip Suggestions
  durationSuggestions: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  durationChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: 11,
    fontWeight: '600',
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
});
