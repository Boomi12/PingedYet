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

  const email = route?.params?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [focusedInput, setFocusedInput] = useState(null);

  const [otpError, setOtpError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const handleResetPassword = async () => {
    setOtpError('');
    setPasswordError('');
    setConfirmError('');
    setErrorText('');

    let hasError = false;

    if (otp.length !== 6) {
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

    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      
      if (Platform.OS === 'web') {
        window.alert('Success: Your password has been reset successfully. You can now log in.');
      } else {
        Alert.alert('Success', 'Your password has been reset successfully. You can now log in.');
      }

      navigation.navigate('Login');
    } catch (err) {
      setErrorText(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = (inputName, hasFieldValidationError) => [
    styles.input,
    { 
      color: colors.textPrimary, 
      borderColor: colors.border, 
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
    },
    focusedInput === inputName && { borderColor: colors.cyan },
    hasFieldValidationError && { borderColor: colors.error }
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
            {/* Header / Brand Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoMargin}>
                <AppLogo size={64} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.brandTextPrimary, { color: colors.textPrimary }]}>Pinged</Text>
                <Text style={[styles.brandTextAccent, { color: colors.cyan }]}>Yet</Text>
              </View>
              <Text style={[styles.logoSubtitle, { color: colors.textSecondary }]}>
                NEXT-GEN APPLICATION TRACKING
              </Text>
            </View>

            {/* Error Alert Card */}
            {errorText ? (
              <View style={[styles.errorCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
                <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={colors.error} />
                <Text style={[styles.errorTextLabel, { color: colors.error }]}>{errorText}</Text>
              </View>
            ) : null}

            {/* Form Container */}
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <Text style={[styles.cornerTag, { color: colors.cyan }]}>SYS_RESET // OTP</Text>
              
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Create New Password</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Enter the 6-digit recovery code sent to:{'\n'}
                <Text style={{ color: colors.cyan, fontWeight: '700' }}>{email || 'your email'}</Text>
              </Text>

              {/* 6-Digit Code Input */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit Recovery Code</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('otp', !!otpError)}
                  placeholder="0 0 0 0 0 0"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={(val) => {
                    setOtpError('');
                    const numeric = val.replace(/[^0-9]/g, '');
                    setOtp(numeric.substring(0, 6));
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  onFocus={() => setFocusedInput('otp')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {otpError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{otpError}</Text> : null}
              </View>

              {/* New Password Input */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('password', !!passwordError)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setPasswordError('');
                    setNewPassword(text);
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

              {/* Confirm Password Input */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('confirm', !!confirmError)}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmError('');
                    setConfirmPassword(text);
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
                  style={styles.resetBtn}
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
            <View style={styles.backPrompt}>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isSubmitting}>
                <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>Back to Login</Text>
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
  logoSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
    textAlign: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  errorTextLabel: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    position: 'relative',
  },
  cornerTag: {
    position: 'absolute',
    top: 14,
    right: 18,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'left',
    marginTop: 10,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
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
    marginTop: 6,
    marginLeft: 4,
  },
  btnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  backPrompt: {
    alignItems: 'center',
    marginTop: 28,
  },
  backLinkText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
