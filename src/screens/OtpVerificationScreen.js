import React, { useState, useContext, useEffect, useRef } from 'react';
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
import { AuthContext } from '../context/AuthContext';
import { authService } from '../services/api';
import AppLogo from '../components/AppLogo';
import CursorSparkles from '../components/CursorSparkles';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function OtpVerificationScreen({ route, navigation }) {
  const { colors, isDark } = useContext(ThemeContext);
  const { completeVerification } = useContext(AuthContext);
  
  const email = route?.params?.email || '';

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const [errorText, setErrorText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    setErrorText('');
    
    if (otp.length !== 6) {
      setErrorText('Verification code must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authService.verifyOtp(email, otp);
      if (response && response.token) {
        // Verification successful, update context session which redirects to Dashboard
        await completeVerification(response);
      } else {
        setErrorText('Invalid verification response. Please try again.');
      }
    } catch (err) {
      setErrorText(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setErrorText('');
    setIsResending(true);
    try {
      await authService.resendOtp(email);
      setTimer(30);
      if (Platform.OS === 'web') {
        window.alert('Success: A new verification code has been sent to your email.');
      } else {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      }
    } catch (err) {
      setErrorText(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
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

            {/* OTP Form Container */}
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <Text style={[styles.cornerTag, { color: colors.cyan }]}>SYS_VERIFY // OTP</Text>
              
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Verify Email</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                We sent a 6-digit code to:{'\n'}
                <Text style={{ color: colors.cyan, fontWeight: '700' }}>{email || 'your email'}</Text>
              </Text>

              {/* 6-Digit Code Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>6-Digit Code</Text>
              <TextInput
                style={[
                  styles.codeInput,
                  { 
                    color: colors.textPrimary, 
                    borderColor: errorText ? colors.error : (isFocused ? colors.cyan : colors.border),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
                  }
                ]}
                placeholder="0 0 0 0 0 0"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={(val) => {
                  setErrorText('');
                  // Only allow numbers, max 6 digits
                  const numeric = val.replace(/[^0-9]/g, '');
                  setOtp(numeric.substring(0, 6));
                }}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />

              {/* Resend Controls */}
              <View style={styles.resendContainer}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                    Resend code in <Text style={{ color: colors.cyan, fontWeight: '700' }}>{timer}s</Text>
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={isResending}>
                    {isResending ? (
                      <ActivityIndicator size="small" color={colors.cyan} />
                    ) : (
                      <Text style={[styles.resendLinkText, { color: colors.cyan }]}>Resend Verification Code</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity 
                style={styles.verifyBtnWrapper}
                onPress={handleVerify}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cyan, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.verifyBtn}
                >
                  {isSubmitting ? (
                    <View style={styles.loaderRow}>
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.verifyBtnText}>Verifying...</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.verifyBtnText}>Verify Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Back to Login Link */}
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    height: 52,
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 24,
    minHeight: 20,
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resendLinkText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  verifyBtnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  verifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyBtnText: {
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
