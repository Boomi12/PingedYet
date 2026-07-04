import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { authService } from '../services/api';
import AppLogo from '../components/AppLogo';
import CursorSparkles from '../components/CursorSparkles';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function ResetPasswordScreen({ route, navigation }) {
  const { colors, isDark } = useContext(ThemeContext);
  const { email } = route.params || {};

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  
  // Validation errors
  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleResetPassword = async () => {
    setOtpError('');
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');

    let hasError = false;

    if (!otp.trim()) {
      setOtpError('Reset code is required.');
      hasError = true;
    } else if (otp.trim().length !== 6) {
      setOtpError('Reset code must be exactly 6 digits.');
      hasError = true;
    }

    if (!newPassword.trim()) {
      setPasswordError('New password is required.');
      hasError = true;
    } else if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmError('Please confirm your new password.');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, otp.trim(), newPassword.trim());
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated. You can now log in with your new credentials.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err) {
      setGeneralError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = (inputName, hasError) => [
    styles.input,
    { 
      color: colors.textPrimary, 
      borderColor: colors.border, 
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
    },
    focusedInput === inputName && { borderColor: colors.cyan },
    hasError && { borderColor: colors.error }
  ];

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
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header section */}
            <View style={styles.logoContainer}>
              <View style={styles.logoMargin}>
                <AppLogo size={68} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[styles.brandTextPrimary, { color: colors.textPrimary }]}>Pinged</Text>
                <Text style={[styles.brandTextAccent, { color: colors.cyan }]}>Yet</Text>
              </View>
              <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                Next-Gen Application tracking
              </Text>
            </View>

            {/* Reset password form card */}
            <View style={[
              styles.card, 
              { 
                backgroundColor: colors.cardBg, 
                borderColor: colors.border, 
                shadowColor: colors.shadow 
              }
            ]}>
              <Text style={[styles.cardCornerTag, { color: colors.cyan }]}>SYS_RESET // SUBMIT</Text>
              
              <View style={styles.formHeaderRow}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Reset Password</Text>
                <View style={[styles.titleDot, { backgroundColor: colors.cyan }]} />
              </View>
              
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Enter the 6-digit code sent to <Text style={{ color: colors.cyan, fontWeight: '700' }}>{email}</Text> and type a new secure password.
              </Text>

              {generalError ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '12', borderColor: colors.error + '40' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{generalError}</Text>
                </View>
              ) : null}

              {/* OTP Reset Code */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Reset Code (6-Digits)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[getInputStyle('otp', !!otpError), { textAlign: 'center', letterSpacing: 4, fontSize: 16 }]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                    if (otpError) setOtpError('');
                  }}
                  onFocus={() => setFocusedInput('otp')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="number-pad"
                  maxLength={6}
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {otpError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{otpError}</Text> : null}
              </View>

              {/* New Password */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('password', !!passwordError)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (passwordError) setPasswordError('');
                  }}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {passwordError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('confirm', !!confirmError)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmError) setConfirmError('');
                  }}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                  secureTextEntry
                  autoCapitalize="none"
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {confirmError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{confirmError}</Text> : null}
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity 
                style={styles.btnWrapper}
                onPress={handleResetPassword}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cyan, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {isSubmitting ? (
                    <View style={styles.loaderRow}>
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Updating Password...</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="lock-reset" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Reset Password</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <View style={styles.loginRedirectPrompt}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isSubmitting}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 28,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  logoMargin: {
    marginBottom: 14,
  },
  brandTextPrimary: {
    fontSize: 30,
    fontWeight: '950',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandTextAccent: {
    fontSize: 30,
    fontWeight: '950',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    alignSelf: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  cardCornerTag: {
    position: 'absolute',
    top: 12,
    right: 18,
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 18,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
    marginTop: 10,
  },
  inputContainer: {
    marginBottom: 14,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  errorLabelText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
  btnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    height: 48,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  loginRedirectPrompt: {
    alignItems: 'center',
    marginTop: 28,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
