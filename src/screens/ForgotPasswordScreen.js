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
  const [errorText, setErrorText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleRequestOtp = async () => {
    setErrorText('');
    
    if (!email.trim()) {
      setErrorText('Email address is required.');
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
      
      if (Platform.OS === 'web') {
        window.alert('Verification Sent: If an account exists, a 6-digit code has been sent.');
      } else {
        Alert.alert('Code Sent', 'If an account exists, a 6-digit code has been sent.');
      }
      
      // Navigate to ResetPassword and pass the email
      navigation.navigate('ResetPassword', { email: email.trim() });
    } catch (err) {
      setErrorText(err.message || 'Request failed. Please try again.');
    } finally {
      setIsSubmitting(false);
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

            {/* Form Container */}
            <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border, shadowColor: colors.shadow }]}>
              <Text style={[styles.cornerTag, { color: colors.cyan }]}>SYS_RECOVERY // v1.0</Text>
              
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Recover Account</Text>
              <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
                Enter your email address and we will send you a 6-digit recovery code to reset your password.
              </Text>

              {/* Email Input */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    color: colors.textPrimary, 
                    borderColor: errorText ? colors.error : (isFocused ? colors.cyan : colors.border),
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF' 
                  }
                ]}
                placeholder="ada@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(val) => {
                  setErrorText('');
                  setEmail(val);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                keyboardAppearance="dark"
                editable={!isSubmitting}
              />

              {/* Send Button */}
              <TouchableOpacity 
                style={styles.btnWrapper}
                onPress={handleRequestOtp}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.cyan, colors.purple]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitBtn}
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
  textInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 24,
  },
  btnWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtn: {
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
