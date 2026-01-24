import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, Music, UserPlus, LogIn, User, UserCircle, AtSign, CheckCircle, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

type AuthMode = 'login' | 'signup' | 'forgot';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, signIn, signInAnonymously, requestPasswordReset, checkUsernameAvailability, isSigningUp, isSigningIn, isResettingPassword, error, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameCheckTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(formAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [logoAnim, formAnim]);

  const shakeForm = useCallback(() => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleUsernameChange = useCallback((text: string) => {
    setUsername(text);
    setUsernameStatus('idle');
    
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }
    
    if (mode === 'signup' && text.trim().length >= 3) {
      setUsernameStatus('checking');
      usernameCheckTimeout.current = setTimeout(async () => {
        try {
          const isAvailable = await checkUsernameAvailability(text.trim());
          setUsernameStatus(isAvailable ? 'available' : 'taken');
        } catch {
          setUsernameStatus('idle');
        }
      }, 500);
    }
  }, [mode, checkUsernameAvailability]);

  const handleSubmit = useCallback(async () => {
    console.log('[Auth] handleSubmit called, mode:', mode);
    clearError();
    setLocalError(null);

    if (mode === 'login') {
      if (!username.trim()) {
        setLocalError('Please enter your username or email');
        shakeForm();
        return;
      }
    } else if (mode === 'signup') {
      if (!username.trim()) {
        setLocalError('Please enter a username');
        shakeForm();
        return;
      }
      if (username.trim().length < 3) {
        setLocalError('Username must be at least 3 characters');
        shakeForm();
        return;
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
        setLocalError('Username can only contain letters, numbers, and underscores');
        shakeForm();
        return;
      }
      if (/^[0-9]/.test(username.trim())) {
        setLocalError('Username cannot start with a number');
        shakeForm();
        return;
      }
      if (usernameStatus === 'taken') {
        setLocalError('This username is already taken');
        shakeForm();
        return;
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setLocalError('Please enter your email');
        shakeForm();
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setLocalError('Please enter a valid email address');
        shakeForm();
        return;
      }
    }

    if (mode !== 'forgot' && !password) {
      setLocalError('Please enter your password');
      shakeForm();
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setLocalError('Password must be at least 8 characters');
        shakeForm();
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setLocalError('Password must contain at least one uppercase letter');
        shakeForm();
        return;
      }
      if (!/[a-z]/.test(password)) {
        setLocalError('Password must contain at least one lowercase letter');
        shakeForm();
        return;
      }
      if (!/[0-9]/.test(password)) {
        setLocalError('Password must contain at least one number');
        shakeForm();
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        shakeForm();
        return;
      }
      if (!displayName.trim()) {
        setLocalError('Please enter your display name');
        shakeForm();
        return;
      }
      if (displayName.trim().length < 2) {
        setLocalError('Display name must be at least 2 characters');
        shakeForm();
        return;
      }
    }

    if (mode === 'forgot') {
      try {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        const result = await requestPasswordReset(email.trim());
        if (result.success) {
          setSuccessMessage({
            title: 'Check Your Email',
            subtitle: result.message,
          });
          setShowSuccessModal(true);
        }
      } catch {
        shakeForm();
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (mode === 'signup') {
        console.log('[Auth] Attempting signup for:', username.trim());
        await signUp(username.trim(), password, displayName.trim(), email.trim() || undefined);
        console.log('[Auth] Signup successful');
        setSuccessMessage({
          title: 'Welcome to Melodyx!',
          subtitle: `Account created for @${username.trim()}. Let's start playing!`,
        });
        setShowSuccessModal(true);
      } else {
        console.log('[Auth] Attempting signin for:', username.trim());
        await signIn(username.trim(), password);
        console.log('[Auth] Signin successful, navigating to tabs');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.log('[Auth] Submit error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setLocalError(errorMessage);
      shakeForm();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [username, email, password, confirmPassword, displayName, mode, usernameStatus, signUp, signIn, requestPasswordReset, clearError, shakeForm, router]);

  const handleGuestLogin = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await signInAnonymously();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)');
    } catch (err) {
      console.log('Guest login error:', err);
    }
  }, [signInAnonymously, router]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.replace('/(tabs)');
  }, [router]);

  const toggleMode = useCallback(() => {
    clearError();
    setLocalError(null);
    setMode(m => m === 'login' ? 'signup' : 'login');
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [clearError]);

  const goToForgotPassword = useCallback(() => {
    clearError();
    setLocalError(null);
    setMode('forgot');
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [clearError]);

  const goBackToLogin = useCallback(() => {
    clearError();
    setLocalError(null);
    setMode('login');
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  }, [clearError]);

  const displayError = localError || error;
  const isLoading = isSigningUp || isSigningIn || isResettingPassword;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFill}
      />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[
            styles.logoContainer,
            {
              opacity: logoAnim,
              transform: [{ scale: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }]
            }
          ]}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/pvwohus8v3p9gw2jrhjcb' }}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>Melodyx</Text>
            <Text style={styles.tagline}>Daily Melody Puzzle</Text>
          </Animated.View>

          <Animated.View style={[
            styles.formContainer,
            {
              opacity: formAnim,
              transform: [
                { translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
                { translateX: shakeAnim }
              ]
            }
          ]}>
            <Text style={styles.formTitle}>
              {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
            </Text>
            <Text style={styles.formSubtitle}>
              {mode === 'login' 
                ? 'Sign in with username or email to sync your progress' 
                : mode === 'signup'
                ? 'Create a unique username to join'
                : 'Enter your email to receive reset instructions'}
            </Text>

            {displayError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {mode !== 'forgot' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <AtSign size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'login' ? "Username or email" : "Username"}
                  placeholderTextColor={Colors.textMuted}
                  value={username}
                  onChangeText={handleUsernameChange}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  maxLength={20}
                />
                {mode === 'signup' && usernameStatus !== 'idle' && (
                  <View style={styles.usernameStatus}>
                    {usernameStatus === 'checking' && (
                      <ActivityIndicator size="small" color={Colors.accent} />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle size={18} color="#10B981" />
                    )}
                    {usernameStatus === 'taken' && (
                      <XCircle size={18} color="#EF4444" />
                    )}
                  </View>
                )}
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <UserCircle size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Display name"
                  placeholderTextColor={Colors.textMuted}
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  maxLength={30}
                />
              </View>
            )}

            {(mode === 'signup' || mode === 'forgot') && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'forgot' ? "Email address" : "Email (optional, for recovery)"}
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            )}

            {mode !== 'forgot' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (mode === 'signup') {
                      const hasUpper = /[A-Z]/.test(text);
                      const hasLower = /[a-z]/.test(text);
                      const hasNumber = /[0-9]/.test(text);
                      const isLong = text.length >= 8;
                      const score = [hasUpper, hasLower, hasNumber, isLong].filter(Boolean).length;
                      if (text.length === 0) setPasswordStrength(null);
                      else if (score <= 2) setPasswordStrength('weak');
                      else if (score === 3) setPasswordStrength('medium');
                      else setPasswordStrength('strong');
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={Colors.textMuted} />
                  ) : (
                    <Eye size={20} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {mode === 'signup' && passwordStrength && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.passwordStrengthBar}>
                  <View style={[
                    styles.passwordStrengthFill,
                    passwordStrength === 'weak' && styles.strengthWeak,
                    passwordStrength === 'medium' && styles.strengthMedium,
                    passwordStrength === 'strong' && styles.strengthStrong,
                  ]} />
                </View>
                <Text style={[
                  styles.passwordStrengthText,
                  passwordStrength === 'weak' && styles.strengthWeakText,
                  passwordStrength === 'medium' && styles.strengthMediumText,
                  passwordStrength === 'strong' && styles.strengthStrongText,
                ]}>
                  {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                </Text>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirementText, password.length >= 8 && styles.requirementMet]}>✓ At least 8 characters</Text>
                <Text style={[styles.requirementText, /[A-Z]/.test(password) && styles.requirementMet]}>✓ One uppercase letter</Text>
                <Text style={[styles.requirementText, /[a-z]/.test(password) && styles.requirementMet]}>✓ One lowercase letter</Text>
                <Text style={[styles.requirementText, /[0-9]/.test(password) && styles.requirementMet]}>✓ One number</Text>
              </View>
            )}

            {mode === 'signup' && (
              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Lock size={20} color={Colors.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            )}

            {mode === 'login' && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={goToForgotPassword}
                disabled={isLoading}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.text} />
              ) : (
                <>
                  {mode === 'login' ? (
                    <LogIn size={20} color={Colors.text} />
                  ) : mode === 'signup' ? (
                    <UserPlus size={20} color={Colors.text} />
                  ) : (
                    <Mail size={20} color={Colors.text} />
                  )}
                  <Text style={styles.submitButtonText}>
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <User size={20} color={Colors.accent} />
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>

            {mode === 'forgot' ? (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={goBackToLogin}
                disabled={isLoading}
              >
                <Text style={styles.toggleText}>
                  Remember your password? <Text style={styles.toggleTextBold}>Sign In</Text>
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={toggleMode}
                disabled={isLoading}
              >
                <Text style={styles.toggleText}>
                  {mode === 'login' 
                    ? "Don't have an account? " 
                    : 'Already have an account? '}
                  <Text style={styles.toggleTextBold}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.footerLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <Animated.View style={styles.successModal}>
            <View style={styles.successIconContainer}>
              <Music size={48} color={Colors.correct} />
            </View>
            <Text style={styles.successTitle}>{successMessage.title}</Text>
            <Text style={styles.successSubtitle}>{successMessage.subtitle}</Text>
            <View style={styles.successBonusContainer}>
              <Text style={styles.successBonusTitle}>🎁 Welcome Bonus!</Text>
              <Text style={styles.successBonusText}>+100 🪙 Coins</Text>
              <Text style={styles.successBonusText}>+3 💡 Hints</Text>
            </View>
            <TouchableOpacity style={styles.successButton} onPress={handleSuccessModalClose}>
              <Text style={styles.successButtonText}>Start Playing!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 20,
    marginBottom: 16,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#EF4444' + '20',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EF4444' + '40',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    padding: 14,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    paddingVertical: 14,
    paddingRight: 14,
  },
  usernameStatus: {
    paddingRight: 14,
  },
  eyeButton: {
    padding: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 8,
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.surfaceLight,
  },
  dividerText: {
    fontSize: 14,
    color: Colors.textMuted,
    paddingHorizontal: 16,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: Colors.accent + '40',
  },
  guestButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  toggleButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  toggleTextBold: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: Colors.accent,
  },
  passwordStrengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthWeak: {
    width: '33%',
    backgroundColor: '#EF4444',
  },
  strengthMedium: {
    width: '66%',
    backgroundColor: '#F59E0B',
  },
  strengthStrong: {
    width: '100%',
    backgroundColor: '#10B981',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  strengthWeakText: {
    color: '#EF4444',
  },
  strengthMediumText: {
    color: '#F59E0B',
  },
  strengthStrongText: {
    color: '#10B981',
  },
  passwordRequirements: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  requirementMet: {
    color: '#10B981',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '90%',
    maxWidth: 340,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.correct + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  successBonusContainer: {
    backgroundColor: Colors.accent + '15',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  successBonusTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.accent,
    marginBottom: 8,
  },
  successBonusText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginVertical: 2,
  },
  successButton: {
    backgroundColor: Colors.correct,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 16,
    width: '100%',
  },
  successButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center',
  },
});
