// Location: src/features/auth/useAuth.ts
// Description: Zustand store for authentication in RepoDock.dev - manages user authentication state, login/logout functionality using better-auth

import { create } from 'zustand';
import { User, LoginCredentials, SignupCredentials } from '@/types';
import { authClient } from '@/lib/auth-client';
import { database } from '@/lib/database';
import { encryptionService } from '@/lib/encryption';
import { authCache, cacheUtils } from '@/lib/cache';
import { cacheWarmer } from '@/components/AppPreloader';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => Promise<boolean>;
  validateSession: () => Promise<boolean>;
  checkAuthStatus: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Helper function to convert better-auth user to our User type
const convertBetterAuthUser = (betterAuthUser: any): User => {
  return {
    id: betterAuthUser.id,
    name: betterAuthUser.name,
    email: betterAuthUser.email,
    emailVerified: betterAuthUser.emailVerified,
    image: betterAuthUser.image,
    createdAt: betterAuthUser.createdAt,
    updatedAt: betterAuthUser.updatedAt,
  };
};

export const useAuth = create<AuthStore>()((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });

    try {
      console.log('Starting login process...');

      const { data, error } = await authClient.signIn.email({
        email: credentials.email,
        password: credentials.password,
      });

      console.log('Login response:', { data: !!data, error: !!error, errorMessage: error?.message });

      if (error) {
        console.error('Login error:', error);
        set({
          error: error.message || 'Login failed. Please try again.',
          isLoading: false
        });
        return false;
      }

      if (data?.user) {
        console.log('Login successful, setting up session...');
        const user = convertBetterAuthUser(data.user);

        // Cache the user data immediately
        authCache.set('current_user', user);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Initialize default data for user (in case it's missing)
        try {
          await database.initializeDefaultData(user.id);
          console.log('Default data initialized successfully');
        } catch (initError) {
          console.error('Failed to initialize default data:', initError);
          // Don't fail the login for this
        }

        // Warm cache with user data
        try {
          cacheWarmer.warmOnLogin(user);
          console.log('Cache warmed successfully');
        } catch (cacheError) {
          console.error('Failed to warm cache:', cacheError);
          // Don't fail the login for this
        }

        // Small delay to ensure state is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log('Login completed successfully');
        return true;
      }

      console.error('No user data returned from login');
      set({
        error: 'Login failed. Please try again.',
        isLoading: false,
      });
      return false;
    } catch (error) {
      console.error('Login catch block error:', error);
      set({
        error: 'Login failed. Please try again.',
        isLoading: false,
      });
      return false;
    }
  },

  signup: async (credentials: SignupCredentials) => {
    set({ isLoading: true, error: null });

    try {
      console.log('Starting signup process...');

      const { data, error } = await authClient.signUp.email({
        name: credentials.name,
        email: credentials.email,
        password: credentials.password,
      });

      console.log('Signup response:', { data: !!data, error: !!error, errorMessage: error?.message });

      if (error) {
        console.error('Signup error:', error);
        set({
          error: error.message || 'Signup failed. Please try again.',
          isLoading: false
        });
        return false;
      }

      if (data?.user) {
        console.log('User created successfully, setting up session...');
        const user = convertBetterAuthUser(data.user);

        // Cache the user data immediately
        authCache.set('current_user', user);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        // Initialize default data for user
        try {
          await database.initializeDefaultData(user.id);
          console.log('Default data initialized successfully');
        } catch (initError) {
          console.error('Failed to initialize default data:', initError);
          // Don't fail the signup for this
        }

        // Warm cache with user data
        try {
          cacheWarmer.warmOnLogin(user);
          console.log('Cache warmed successfully');
        } catch (cacheError) {
          console.error('Failed to warm cache:', cacheError);
          // Don't fail the signup for this
        }

        // Verify session is properly established
        try {
          const sessionCheck = await authClient.getSession();
          console.log('Session verification:', { hasSession: !!sessionCheck.data });

          if (!sessionCheck.data) {
            console.warn('Session not established after signup, but user was created');
            // Try to sign in the user manually since auto-signin might have failed
            try {
              console.log('Attempting manual signin after signup...');
              const signInResult = await authClient.signIn.email({
                email: credentials.email,
                password: credentials.password,
              });

              if (signInResult.data?.user) {
                console.log('Manual signin successful after signup');
              } else {
                console.error('Manual signin failed after signup:', signInResult.error);
              }
            } catch (manualSignInError) {
              console.error('Manual signin error after signup:', manualSignInError);
            }
          }
        } catch (sessionError) {
          console.error('Session verification failed:', sessionError);
        }

        // Small delay to ensure state is updated before redirect
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('Signup completed successfully');
        return true;
      }

      console.error('No user data returned from signup');
      set({
        error: 'Signup failed. Please try again.',
        isLoading: false,
      });
      return false;
    } catch (error) {
      console.error('Signup catch block error:', error);
      set({
        error: 'Signup failed. Please try again.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    const { user } = get();

    try {
      // Clear encryption keys and passwords
      if (user) {
        encryptionService.clearMasterKey(user.id);
        encryptionService.clearUserEncryptionPassword(user.email);

        // Clear all cached data for this user
        cacheUtils.invalidateUserData(user.id);
      }

      // Clear auth cache
      authCache.clear();

      // Sign out from better-auth
      await authClient.signOut();

      // Reset auth state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still reset state even if logout fails
      authCache.clear();
      if (user) {
        cacheUtils.invalidateUserData(user.id);
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateUser: async (updates: Partial<User>) => {
    const { user } = get();
    if (!user) return false;

    set({ isLoading: true, error: null });

    try {
      console.log('Updating user profile...', updates);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const { user: updatedUser } = await response.json();
      console.log('Profile updated successfully:', updatedUser);

      // Update local state with the response from server
      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });

      // Update cache
      authCache.set('current_user', updatedUser);

      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update profile',
        isLoading: false,
      });
      return false;
    }
  },

  // Validate current session
  validateSession: async () => {
    try {
      console.log('Validating session...');
      const { data, error } = await authClient.getSession();

      console.log('Session validation result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasError: !!error,
        errorMessage: error?.message
      });

      if (data?.user) {
        const user = convertBetterAuthUser(data.user);
        authCache.set('current_user', user);

        set({
          user,
          isAuthenticated: true,
          error: null,
        });

        return true;
      } else {
        authCache.clear();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        return false;
      }
    } catch (error) {
      console.error('Session validation error:', error);
      authCache.clear();
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      return false;
    }
  },

  checkAuthStatus: async () => {
    try {
      // First check cache for immediate response
      const cachedUser = authCache.get<User>('current_user');
      if (cachedUser) {
        set({
          user: cachedUser,
          isAuthenticated: true,
          isLoading: false,
        });

        // Still verify session in background but don't block UI
        authClient.getSession().then(session => {
          if (session?.data?.user) {
            const user = convertBetterAuthUser(session.data.user);
            // Update cache and state if user data changed
            if (JSON.stringify(user) !== JSON.stringify(cachedUser)) {
              authCache.set('current_user', user);
              set({ user });
            }
          } else {
            // Session expired, clear cache and state
            authCache.clear();
            set({
              user: null,
              isAuthenticated: false,
            });
          }
        }).catch(() => {
          // Session check failed, clear cache and state
          authCache.clear();
          set({
            user: null,
            isAuthenticated: false,
          });
        });

        return; // Return early with cached data
      }

      // No cache, fetch session normally
      const session = await authClient.getSession();
      if (session?.data?.user) {
        const user = convertBetterAuthUser(session.data.user);

        // Cache the user data
        authCache.set('current_user', user);

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Check auth status error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
