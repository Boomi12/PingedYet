import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@interview_tracker_token';
const USER_NAME_KEY = '@interview_tracker_user_name';
const USER_EMAIL_KEY = '@interview_tracker_user_email';
const USER_CREATED_KEY = '@interview_tracker_user_created';

/**
 * Save user authentication session to AsyncStorage.
 */
export const setSession = async (token, name, email, createdAt) => {
  try {
    await AsyncStorage.multiSet([
      [TOKEN_KEY, token],
      [USER_NAME_KEY, name],
      [USER_EMAIL_KEY, email],
      [USER_CREATED_KEY, createdAt || '']
    ]);
    return true;
  } catch (error) {
    console.error('Error saving session details:', error);
    return false;
  }
};

/**
 * Retrieve user auth session details.
 */
export const getSession = async () => {
  try {
    const keys = [TOKEN_KEY, USER_NAME_KEY, USER_EMAIL_KEY, USER_CREATED_KEY];
    const results = await AsyncStorage.multiGet(keys);
    
    const token = results[0][1];
    const name = results[1][1];
    const email = results[2][1];
    const createdAt = results[3][1];

    if (!token) return null;

    return { token, name, email, createdAt };
  } catch (error) {
    console.error('Error retrieving session details:', error);
    return null;
  }
};

/**
 * Delete authentication session details (Logout).
 */
export const clearSession = async () => {
  try {
    const keys = [TOKEN_KEY, USER_NAME_KEY, USER_EMAIL_KEY, USER_CREATED_KEY];
    await AsyncStorage.multiRemove(keys);
    return true;
  } catch (error) {
    console.error('Error clearing session details:', error);
    return false;
  }
};
