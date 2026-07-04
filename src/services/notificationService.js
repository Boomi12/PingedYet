import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = '@pingedyet_notifications_enabled';

// Setup notification listener handlers for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Retrieve user's notification configuration status. Defaults to true.
 */
export const getNotificationPreference = async () => {
  try {
    const val = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

/**
 * Persist user's notification config preference in AsyncStorage.
 */
export const setNotificationPreference = async (enabled) => {
  try {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('[NotificationService] Error saving preference:', error);
  }
};

/**
 * Request system notifications permissions from iOS or Android OS.
 */
export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') return true;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[NotificationService] System permission query failed:', error);
    return false;
  }
};

/**
 * Schedule local notification remind loop for interview dates.
 * Triggers 1 day prior at 9:00 AM, or in 10 seconds if dates are near.
 */
export const scheduleInterviewReminder = async (companyName, role, interviewDateStr) => {
  if (Platform.OS === 'web' || !interviewDateStr) return null;

  const isEnabled = await getNotificationPreference();
  if (!isEnabled) {
    console.log('[NotificationService] Reminders are toggled OFF by user settings.');
    return null;
  }

  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log('[NotificationService] Permissions not granted by OS.');
    return null;
  }

  try {
    // Parse 'YYYY-MM-DD' correctly
    const [year, month, day] = interviewDateStr.split('-').map(Number);
    // Month is 0-indexed in Javascript Dates
    const interviewDate = new Date(year, month - 1, day, 9, 0, 0);

    const triggerDate = new Date(interviewDate);
    triggerDate.setDate(triggerDate.getDate() - 1); // 1 day before

    const now = new Date();
    let trigger = triggerDate;

    // Schedule 10 seconds in the future if date is today, tomorrow, or in the past
    if (triggerDate <= now) {
      trigger = new Date(Date.now() + 10000); 
      console.log('[NotificationService] Near interview date. Scheduling immediate reminder in 10s:', trigger);
    } else {
      console.log('[NotificationService] Scheduled interview reminder for:', trigger);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Interview Reminder',
        body: `Your interview for ${role} at ${companyName} is coming up.`,
        sound: true,
        priority: Notifications.AndroidPriority.HIGH,
      },
      trigger,
    });

    return notificationId;
  } catch (error) {
    console.error('[NotificationService] Scheduling notification failed:', error);
    return null;
  }
};

/**
 * Cancel a previously scheduled reminder by ID.
 */
export const cancelReminder = async (notificationId) => {
  if (Platform.OS === 'web' || !notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('[NotificationService] Successfully cancelled reminder ID:', notificationId);
  } catch (error) {
    console.error('[NotificationService] Cancel notification failed:', error);
  }
};
