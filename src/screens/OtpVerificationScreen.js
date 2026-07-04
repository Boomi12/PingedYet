import React, { useState, useEffect, useContext, useRef } from 'react';
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
  const { email } = route.params || {};

  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Countdown timer for resending OTP
  const [timer, setTimer] = useState(30);
  const timerRef = useRef(null);

  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const startTimer = () => {
    setTimer(30);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async () => {
    setErrorText('');
    if (!otp.trim()) {
      setErrorText('Please enter the 6-digit verification code.');
      return;
    }

    if (otp.trim().length !== 6) {
      setErrorText('The code must be exactly 6 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.verifyOtp(email, otp.trim());
      if (data && data.token) {
        // Log user in automatically!
        await completeVerification(data);
      } else {
        setErrorText('Verification failed. Invalid code.');
        setIsSubmitting(false);
      }
    } catch (err) {
      setErrorText(err.message || 'Verification failed. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorText('');
    setOtp('');
    setIsSubmitting(true);
    try {
      await authService.resendOtp(email);
      Alert.alert('Code Resent', 'A new 6-digit verification code has been sent to your email.');
      startTimer();
    } catch (err) {
      setErrorText(err.message || 'Could not resend verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputStyle = () => [
    styles.input,
    { 
      color: colors.textPrimary, 
      borderColor: colors.border, 
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
    },
    focusedInput && { borderColor: colors.cyan },
    !!errorText && { borderColor: colors.error }
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
            {/* Logo and Header */}
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

            {/* Verification Card */}
            <View style={[
              styles.card, 
              { 
                backgroundColor: colors.cardBg, 
                borderColor: colors.border, 
                shadowColor: colors.shadow 
              }
            ]}>
              <Text style={[styles.cardCornerTag, { color: colors.cyan }]}>SYS_VERIFY // OTP</Text>
              
              <View style={styles.formHeaderRow}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Verify Email</Text>
                <View style={[styles.titleDot, { backgroundColor: colors.cyan }]} />
              </View>
              
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                We sent a 6-digit code to: {'\n'}
                <Text style={[styles.emailHighlight, { color: colors.cyan }]}>{email}</Text>
              </Text>

              {errorText ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '12', borderColor: colors.error + '40' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errorText}</Text>
                </View>
              ) : null}

              {/* OTP Input */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>6-Digit Code</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle()}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, '').slice(0, 6));
                    if (errorText) setErrorText('');
                  }}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
              </View>

              {/* Timer & Resend Option */}
              <View style={styles.resendRow}>
                {timer > 0 ? (
                  <Text style={[styles.timerText, { color: colors.textMuted }]}>
                    Resend code in {timer}s
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResend} disabled={isSubmitting}>
                    <Text style={[styles.resendLinkText, { color: colors.cyan }]}>
                      Resend Verification Code
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity 
                style={styles.btnWrapper}
                onPress={handleVerify}
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
                      <Text style={styles.btnText}>Verifying...</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Verify Code</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Back to Login Redirect */}
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
  emailHighlight: {
    fontWeight: '800',
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
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 6,
    textAlign: 'center',
  },
  resendRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resendLinkText: {
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  btnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
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
