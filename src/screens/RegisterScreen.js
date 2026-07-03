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
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import AppLogo from '../components/AppLogo';
import CursorSparkles from '../components/CursorSparkles';
import BackgroundBubbles from '../components/BackgroundBubbles';

export default function RegisterScreen({ navigation }) {
  const { colors, isDark } = useContext(ThemeContext);
  const { signUp } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Validation States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const handleRegister = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasError = false;

    if (!name.trim()) {
      setNameError('Name is required.');
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError('Email is required.');
      hasError = true;
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email.trim())) {
        setEmailError('Please enter a valid email address.');
        hasError = true;
      }
    }

    if (!password.trim()) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);
    const result = await signUp(name.trim(), email.trim(), password.trim());
    
    if (!result.success) {
      setGeneralError(result.error || 'Failed to create an account.');
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
            {/* Logo / Header Branding */}
            <View style={styles.logoContainer}>
              <View style={styles.logoMargin}>
                <AppLogo size={64} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[styles.brandTextPrimary, { color: colors.textPrimary }]}>Pinged</Text>
                <Text style={[styles.brandTextAccent, { color: colors.cyan }]}>Yet</Text>
              </View>
              <Text style={[styles.logoSubtitle, { color: colors.textSecondary }]}>
                Track every application. Never miss an opportunity.
              </Text>
            </View>

            {/* General Error Panel */}
            {generalError ? (
              <View style={[styles.errorAlertCard, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
                <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={colors.error} />
                <Text style={[styles.errorAlertText, { color: colors.error }]}>{generalError}</Text>
              </View>
            ) : null}

            {/* Form Card */}
            <View style={[
              styles.formCard, 
              { 
                backgroundColor: colors.cardBg, 
                borderColor: colors.border, 
                shadowColor: colors.shadow 
              }
            ]}>
              <Text style={[styles.cardCornerTag, { color: colors.cyan }]}>SYS_AUTH // v1.0</Text>
              
              <View style={styles.formHeaderRow}>
                <Text style={[styles.formTitle, { color: colors.textPrimary }]}>Create Account</Text>
                <View style={[styles.titleDot, { backgroundColor: colors.cyan }]} />
              </View>
              
              {/* Name */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('name', !!nameError)}
                  placeholder="Ada Lovelace"
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (nameError) setNameError('');
                    if (generalError) setGeneralError('');
                  }}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {nameError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{nameError}</Text> : null}
              </View>

              {/* Email */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('email', !!emailError)}
                  placeholder="ada@example.com"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                    if (generalError) setGeneralError('');
                  }}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  keyboardAppearance="dark"
                  editable={!isSubmitting}
                />
                {emailError ? <Text style={[styles.errorLabelText, { color: colors.error }]}>{emailError}</Text> : null}
              </View>

              {/* Password */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={getInputStyle('password', !!passwordError)}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                    if (generalError) setGeneralError('');
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

              {/* Register Button */}
              <TouchableOpacity 
                style={styles.btnWrapper}
                onPress={handleRegister}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.purple, colors.cyan]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  {isSubmitting ? (
                    <View style={styles.loaderRow}>
                      <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.btnText}>Registering...</Text>
                    </View>
                  ) : (
                    <>
                      <MaterialCommunityIcons name="account-plus-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.btnText}>Sign Up</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Login Redirect */}
            <View style={styles.loginPrompt}>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>Already have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isSubmitting}>
                <Text style={[styles.linkText, { color: colors.cyan }]}>Log In</Text>
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
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      android: {
        textShadowColor: 'rgba(0, 240, 255, 0.4)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
      },
      web: {
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        backgroundImage: 'linear-gradient(90deg, #00F0FF, #FF007F)',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        textShadow: '0 0 8px rgba(0, 240, 255, 0.2)',
      }
    })
  },
  logoSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 18,
  },
  errorAlertCard: {
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
  errorAlertText: {
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
  formHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 6,
  },
  cardCornerTag: {
    position: 'absolute',
    top: 14,
    right: 18,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.6,
  },
  titleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputContainer: {
    marginBottom: 18,
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
  btnWrapper: {
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
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    gap: 6,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  promptText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
