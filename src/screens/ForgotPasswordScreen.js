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

export default function ForgotPasswordScreen({ navigation }) {
  const { colors, isDark } = useContext(ThemeContext);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSendCode = async () => {
    setErrorText('');

    if (!email.trim()) {
      setErrorText('Please enter your email address.');
      return;
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorText('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email.trim());
      Alert.alert(
        'Code Sent', 
        'A 6-digit password reset code has been sent to your email.',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('ResetPassword', { email: email.trim() }) 
          }
        ]
      );
    } catch (err) {
      setErrorText(err.message || 'Failed to send reset code. Please try again.');
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
            {/* Logo Section */}
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

            {/* Forgot Password Card */}
            <View style={[
              styles.card, 
              { 
                backgroundColor: colors.cardBg, 
                borderColor: colors.border, 
                shadowColor: colors.shadow 
              }
            ]}>
              <Text style={[styles.cardCornerTag, { color: colors.cyan }]}>SYS_RESET // FORGOT</Text>
              
              <View style={styles.formHeaderRow}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Forgot Password</Text>
                <View style={[styles.titleDot, { backgroundColor: colors.cyan }]} />
              </View>
              
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
                Enter the email address associated with your account, and we will send you a 6-digit code to reset your password.
              </Text>

              {errorText ? (
                <View style={[styles.errorContainer, { backgroundColor: colors.error + '12', borderColor: colors.error + '40' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{errorText}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle()}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errorText) setErrorText('');
                  }}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
              </View>

              {/* Action Button */}
              <TouchableOpacity 
                style={styles.btnWrapper}
                onPress={handleSendCode}
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
                      <Text style={styles.btnText}>Sending Code...</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="email-send-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Send Reset Code</Text>
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
    marginBottom: 24,
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
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  btnWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
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
