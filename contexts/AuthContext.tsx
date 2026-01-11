import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { captureError, addBreadcrumb } from '@/utils/errorTracking';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  createdAt: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

interface AuthCredentials {
  email: string;
  password: string;
  displayName?: string;
}

interface PasswordResetRequest {
  email: string;
  token: string;
  expiresAt: number;
}

const PASSWORD_RESET_STORAGE_KEY = 'melodyx_password_resets';
const AUTH_STORAGE_KEY = 'melodyx_auth_state';
const AUTH_TOKEN_KEY = 'melodyx_auth_token';
const USERS_STORAGE_KEY = 'melodyx_users_db';

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  } else {
    return SecureStore.getItemAsync(key);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  WEAK_PASSWORD: 'Password is too weak. Use at least 8 characters with uppercase, lowercase, and numbers.',
  EMAIL_TAKEN: 'An account with this email already exists. Try signing in instead.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  USER_NOT_FOUND: 'No account found with this email. Would you like to sign up?',
  TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please try again in a few minutes.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  NAME_TOO_SHORT: 'Name must be at least 2 characters.',
  NAME_TOO_LONG: 'Name must be less than 50 characters.',
  NAME_INVALID_CHARS: 'Name can only contain letters, numbers, spaces, and hyphens.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
  PASSWORD_NO_UPPERCASE: 'Password must contain at least one uppercase letter.',
  PASSWORD_NO_LOWERCASE: 'Password must contain at least one lowercase letter.',
  PASSWORD_NO_NUMBER: 'Password must contain at least one number.',
} as const;

interface StoredUser {
  uid: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function generateUid(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long' };
  }
  return { valid: true };
}

function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

function validateDisplayName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  if (!/^[a-zA-Z0-9\s_-]+$/.test(name.trim())) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, hyphens, and underscores' };
  }
  return { valid: true };
}

async function getUsersDb(): Promise<StoredUser[]> {
  try {
    const stored = await AsyncStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('Error reading users DB:', error);
    return [];
  }
}

async function saveUsersDb(users: StoredUser[]): Promise<void> {
  await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

function generateResetToken(): string {
  return `reset_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function getPasswordResets(): Promise<PasswordResetRequest[]> {
  try {
    const stored = await AsyncStorage.getItem(PASSWORD_RESET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.log('Error reading password resets:', error);
    return [];
  }
}

async function savePasswordResets(resets: PasswordResetRequest[]): Promise<void> {
  await AsyncStorage.setItem(PASSWORD_RESET_STORAGE_KEY, JSON.stringify(resets));
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [authError, setAuthError] = useState<string | null>(null);

  const authQuery = useQuery({
    queryKey: ['authState'],
    queryFn: async (): Promise<AuthState> => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthState;
          if (parsed.isAuthenticated && parsed.user) {
            const token = await secureGet(AUTH_TOKEN_KEY);
            if (!token) {
              console.log('[Auth] No session token found, clearing auth state');
              return { user: null, isAuthenticated: false, isAnonymous: false };
            }
            console.log('[Auth] Session token validated');
          }
          console.log('[Auth] Restored auth state:', parsed.user?.email || 'anonymous');
          return parsed;
        }
      } catch (error) {
        console.log('[Auth] Error loading auth state:', error);
      }
      return { user: null, isAuthenticated: false, isAnonymous: false };
    },
  });

  const { mutateAsync: saveAuthState } = useMutation({
    mutationFn: async (state: AuthState) => {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
      if (state.user && state.isAuthenticated) {
        const token = `session_${state.user.uid}_${Date.now()}`;
        await secureSet(AUTH_TOKEN_KEY, token);
        console.log('[Auth] Session token stored securely');
      } else {
        await secureDelete(AUTH_TOKEN_KEY);
      }
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authState'] });
    },
  });

  const authState = authQuery.data ?? { user: null, isAuthenticated: false, isAnonymous: false };

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, displayName }: AuthCredentials): Promise<AuthUser> => {
      setAuthError(null);
      addBreadcrumb({ category: 'auth', message: 'Sign up attempt', level: 'info' });
      
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error);
      }
      
      if (displayName) {
        const nameValidation = validateDisplayName(displayName);
        if (!nameValidation.valid) {
          throw new Error(nameValidation.error);
        }
      }

      const users = await getUsersDb();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error(ERROR_MESSAGES.EMAIL_TAKEN);
      }

      const uid = generateUid();
      const userName = displayName?.trim() || email.split('@')[0];
      const newUser: StoredUser = {
        uid,
        email: email.toLowerCase(),
        passwordHash: simpleHash(password),
        displayName: userName,
        createdAt: new Date().toISOString(),
      };

      await saveUsersDb([...users, newUser]);

      const authUser: AuthUser = {
        uid,
        email: newUser.email,
        displayName: newUser.displayName,
        isAnonymous: false,
        createdAt: newUser.createdAt,
      };

      await saveAuthState({
        user: authUser,
        isAuthenticated: true,
        isAnonymous: false,
      });

      addBreadcrumb({ category: 'auth', message: `User signed up: ${email}`, level: 'info' });
      console.log('[Auth] User signed up:', email, 'as', userName);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      captureError(error, { tags: { component: 'Auth', action: 'signUp' } });
      console.log('[Auth] Sign up error:', error.message);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: AuthCredentials): Promise<AuthUser> => {
      setAuthError(null);
      addBreadcrumb({ category: 'auth', message: 'Sign in attempt', level: 'info' });

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }
      if (!password) {
        throw new Error('Please enter your password');
      }

      const users = await getUsersDb();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      if (user.passwordHash !== simpleHash(password)) {
        throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }

      const authUser: AuthUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: false,
        createdAt: user.createdAt,
      };

      await saveAuthState({
        user: authUser,
        isAuthenticated: true,
        isAnonymous: false,
      });

      addBreadcrumb({ category: 'auth', message: `User signed in: ${email}`, level: 'info' });
      console.log('[Auth] User signed in:', email);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      captureError(error, { tags: { component: 'Auth', action: 'signIn' } });
      console.log('[Auth] Sign in error:', error.message);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    },
  });

  const signInAnonymouslyMutation = useMutation({
    mutationFn: async (): Promise<AuthUser> => {
      setAuthError(null);
      
      const uid = generateUid();
      const authUser: AuthUser = {
        uid,
        email: null,
        displayName: 'Guest Player',
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };

      await saveAuthState({
        user: authUser,
        isAuthenticated: true,
        isAnonymous: true,
      });

      console.log('[Auth] Anonymous sign in');
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Anonymous sign in error:', error.message);
    },
  });

  const signOutMutation = useMutation({
    mutationFn: async (): Promise<void> => {
      await saveAuthState({
        user: null,
        isAuthenticated: false,
        isAnonymous: false,
      });
      console.log('[Auth] User signed out');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (displayName: string): Promise<void> => {
      if (!authState.user) return;

      const updatedUser: AuthUser = {
        ...authState.user,
        displayName,
      };

      await saveAuthState({
        ...authState,
        user: updatedUser,
      });

      if (!authState.isAnonymous && authState.user.email) {
        const users = await getUsersDb();
        const updatedUsers = users.map(u => 
          u.uid === authState.user!.uid ? { ...u, displayName } : u
        );
        await saveUsersDb(updatedUsers);
      }

      console.log('[Auth] Profile updated:', displayName);
    },
  });

  const linkAnonymousAccountMutation = useMutation({
    mutationFn: async ({ email, password }: AuthCredentials): Promise<AuthUser> => {
      setAuthError(null);

      if (!authState.user || !authState.isAnonymous) {
        throw new Error('No anonymous account to link');
      }

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error);
      }

      const users = await getUsersDb();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error(ERROR_MESSAGES.EMAIL_TAKEN);
      }

      const newUser: StoredUser = {
        uid: authState.user.uid,
        email: email.toLowerCase(),
        passwordHash: simpleHash(password),
        displayName: authState.user.displayName || email.split('@')[0],
        createdAt: authState.user.createdAt,
      };

      await saveUsersDb([...users, newUser]);

      const authUser: AuthUser = {
        ...authState.user,
        email: newUser.email,
        displayName: newUser.displayName,
        isAnonymous: false,
      };

      await saveAuthState({
        user: authUser,
        isAuthenticated: true,
        isAnonymous: false,
      });

      console.log('[Auth] Anonymous account linked:', email);
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Link account error:', error.message);
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: async (email: string): Promise<{ success: boolean; message: string }> => {
      setAuthError(null);

      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        throw new Error(emailValidation.error);
      }

      const users = await getUsersDb();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        return { 
          success: true, 
          message: 'If an account exists with this email, you will receive reset instructions.' 
        };
      }

      const token = generateResetToken();
      const expiresAt = Date.now() + (60 * 60 * 1000);

      const resets = await getPasswordResets();
      const filteredResets = resets.filter(r => r.email !== email.toLowerCase());
      await savePasswordResets([...filteredResets, { email: email.toLowerCase(), token, expiresAt }]);

      console.log('[Auth] Password reset requested for:', email);
      console.log('[Auth] Reset token (dev only):', token);
      
      return { 
        success: true, 
        message: 'Password reset instructions sent! Check your email.' 
      };
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Password reset request error:', error.message);
    },
  });

  const confirmPasswordResetMutation = useMutation({
    mutationFn: async ({ token, newPassword }: { token: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
      setAuthError(null);

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error);
      }

      const resets = await getPasswordResets();
      const resetRequest = resets.find(r => r.token === token && r.expiresAt > Date.now());

      if (!resetRequest) {
        throw new Error('Invalid or expired reset token');
      }

      const users = await getUsersDb();
      const userIndex = users.findIndex(u => u.email === resetRequest.email);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      users[userIndex].passwordHash = simpleHash(newPassword);
      await saveUsersDb(users);

      const updatedResets = resets.filter(r => r.token !== token);
      await savePasswordResets(updatedResets);

      console.log('[Auth] Password reset confirmed for:', resetRequest.email);
      return { success: true, message: 'Password successfully reset! You can now sign in.' };
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Password reset confirm error:', error.message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<void> => {
      setAuthError(null);

      if (!authState.user || authState.isAnonymous) {
        throw new Error('You must be signed in to change your password');
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.error);
      }
      
      if (currentPassword === newPassword) {
        throw new Error('New password must be different from current password');
      }

      const users = await getUsersDb();
      const userIndex = users.findIndex(u => u.uid === authState.user!.uid);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      if (users[userIndex].passwordHash !== simpleHash(currentPassword)) {
        throw new Error('Current password is incorrect');
      }

      users[userIndex].passwordHash = simpleHash(newPassword);
      await saveUsersDb(users);

      console.log('[Auth] Password changed for:', authState.user.email);
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Change password error:', error.message);
    },
  });

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const { mutateAsync: doSignUp } = signUpMutation;
  const { mutateAsync: doSignIn } = signInMutation;
  const { mutateAsync: doSignInAnonymously } = signInAnonymouslyMutation;
  const { mutateAsync: doSignOut } = signOutMutation;
  const { mutateAsync: doUpdateProfile } = updateProfileMutation;
  const { mutateAsync: doLinkAccount } = linkAnonymousAccountMutation;
  const { mutateAsync: doRequestPasswordReset } = requestPasswordResetMutation;
  const { mutateAsync: doConfirmPasswordReset } = confirmPasswordResetMutation;
  const { mutateAsync: doChangePassword } = changePasswordMutation;

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    return doSignUp({ email, password, displayName });
  }, [doSignUp]);

  const signIn = useCallback(async (email: string, password: string) => {
    return doSignIn({ email, password });
  }, [doSignIn]);

  const signInAnonymously = useCallback(async () => {
    return doSignInAnonymously();
  }, [doSignInAnonymously]);

  const signOut = useCallback(async () => {
    return doSignOut();
  }, [doSignOut]);

  const updateDisplayName = useCallback(async (displayName: string) => {
    return doUpdateProfile(displayName);
  }, [doUpdateProfile]);

  const linkAnonymousAccount = useCallback(async (email: string, password: string) => {
    return doLinkAccount({ email, password });
  }, [doLinkAccount]);

  const requestPasswordReset = useCallback(async (email: string) => {
    return doRequestPasswordReset(email);
  }, [doRequestPasswordReset]);

  const confirmPasswordReset = useCallback(async (token: string, newPassword: string) => {
    return doConfirmPasswordReset({ token, newPassword });
  }, [doConfirmPasswordReset]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    return doChangePassword({ currentPassword, newPassword });
  }, [doChangePassword]);

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isAnonymous: authState.isAnonymous,
    isLoading: authQuery.isLoading,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    isResettingPassword: requestPasswordResetMutation.isPending || confirmPasswordResetMutation.isPending,
    isChangingPassword: changePasswordMutation.isPending,
    error: authError,
    signUp,
    signIn,
    signInAnonymously,
    signOut,
    updateDisplayName,
    linkAnonymousAccount,
    requestPasswordReset,
    confirmPasswordReset,
    changePassword,
    clearError,
  };
});
