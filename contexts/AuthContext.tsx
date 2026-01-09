import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

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
}

const AUTH_STORAGE_KEY = 'melodyx_auth_state';
const USERS_STORAGE_KEY = 'melodyx_users_db';

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

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
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
      return state;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authState'] });
    },
  });

  const authState = authQuery.data ?? { user: null, isAuthenticated: false, isAnonymous: false };

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password }: AuthCredentials): Promise<AuthUser> => {
      setAuthError(null);
      
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters');
      }

      const users = await getUsersDb();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      const uid = generateUid();
      const newUser: StoredUser = {
        uid,
        email: email.toLowerCase(),
        passwordHash: simpleHash(password),
        displayName: email.split('@')[0],
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

      console.log('[Auth] User signed up:', email);
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Sign up error:', error.message);
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: AuthCredentials): Promise<AuthUser> => {
      setAuthError(null);

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!password) {
        throw new Error('Please enter your password');
      }

      const users = await getUsersDb();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!user) {
        throw new Error('No account found with this email');
      }

      if (user.passwordHash !== simpleHash(password)) {
        throw new Error('Incorrect password');
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

      console.log('[Auth] User signed in:', email);
      return authUser;
    },
    onError: (error: Error) => {
      setAuthError(error.message);
      console.log('[Auth] Sign in error:', error.message);
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

      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      if (!validatePassword(password)) {
        throw new Error('Password must be at least 6 characters');
      }

      const users = await getUsersDb();
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error('An account with this email already exists');
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

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const { mutateAsync: doSignUp } = signUpMutation;
  const { mutateAsync: doSignIn } = signInMutation;
  const { mutateAsync: doSignInAnonymously } = signInAnonymouslyMutation;
  const { mutateAsync: doSignOut } = signOutMutation;
  const { mutateAsync: doUpdateProfile } = updateProfileMutation;
  const { mutateAsync: doLinkAccount } = linkAnonymousAccountMutation;

  const signUp = useCallback(async (email: string, password: string) => {
    return doSignUp({ email, password });
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

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isAnonymous: authState.isAnonymous,
    isLoading: authQuery.isLoading,
    isSigningUp: signUpMutation.isPending,
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    error: authError,
    signUp,
    signIn,
    signInAnonymously,
    signOut,
    updateDisplayName,
    linkAnonymousAccount,
    clearError,
  };
});
