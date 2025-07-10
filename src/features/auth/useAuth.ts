// Location: src/features/auth/useAuth.ts
// Description: Zustand store for authentication in RepoDock.dev - manages user authentication state, login/logout functionality, and user session persistence using local storage

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginCredentials, SignupCredentials } from '@/types';
import { localDB } from '@/lib/localdb';
import { encryptionService } from '@/lib/encryption';
import { generateId } from '@/lib/utils';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (credentials: SignupCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (updates: Partial<User>) => void;
  checkAuthStatus: () => void;
}

type AuthStore = AuthState & AuthActions;

// Mock user database for local authentication
const getUserByUsername = (username: string): User | null => {
  const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');

  // Create demo user if it doesn't exist
  if (users.length === 0 && username === 'demo') {
    const demoUser = {
      id: 'demo_user_1',
      username: 'demo',
      email: 'demo@repodock.dev',
      passwordHash: encryptionService.hashPassword('demo123'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(demoUser);
    localStorage.setItem('repodock_users', JSON.stringify(users));
  }

  return users.find((user: User & { passwordHash: string }) => user.username === username) || null;
};

const createUser = (userData: SignupCredentials): User => {
  const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');
  
  const newUser: User & { passwordHash: string } = {
    id: generateId('user'),
    username: userData.username,
    email: userData.email,
    passwordHash: encryptionService.hashPassword(userData.password),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem('repodock_users', JSON.stringify(users));
  
  // Return user without password hash
  const { passwordHash, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

const verifyUserPassword = (username: string, password: string): boolean => {
  const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');
  const user = users.find((u: User & { passwordHash: string }) => u.username === username);
  
  if (!user) return false;
  
  return encryptionService.verifyPassword(password, user.passwordHash);
};

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if user exists
          const existingUser = getUserByUsername(credentials.username);
          if (!existingUser) {
            set({ error: 'Invalid username or password', isLoading: false });
            return false;
          }

          // Verify password
          const isValidPassword = verifyUserPassword(credentials.username, credentials.password);
          if (!isValidPassword) {
            set({ error: 'Invalid username or password', isLoading: false });
            return false;
          }

          // Set user as authenticated
          set({
            user: existingUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store user in localDB
          localDB.setUser(existingUser);
          
          // Initialize default data for user
          localDB.initializeDefaultData(existingUser.id);

          return true;
        } catch (error) {
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
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check if username already exists
          const existingUser = getUserByUsername(credentials.username);
          if (existingUser) {
            set({ error: 'Username already exists', isLoading: false });
            return false;
          }

          // Check if email already exists
          const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');
          const existingEmail = users.find((user: User) => user.email === credentials.email);
          if (existingEmail) {
            set({ error: 'Email already exists', isLoading: false });
            return false;
          }

          // Create new user
          const newUser = createUser(credentials);

          // Set user as authenticated
          set({
            user: newUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Store user in localDB
          localDB.setUser(newUser);
          
          // Initialize default data for user
          localDB.initializeDefaultData(newUser.id);

          return true;
        } catch (error) {
          set({
            error: 'Signup failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        const { user } = get();
        
        // Clear encryption keys
        if (user) {
          encryptionService.clearMasterKey(user.id);
        }

        // Clear all local data
        localDB.clearAllData();

        // Reset auth state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        const updatedUser = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set({ user: updatedUser });
        localDB.setUser(updatedUser);

        // Update in users storage as well
        const users = JSON.parse(localStorage.getItem('repodock_users') || '[]');
        const userIndex = users.findIndex((u: User) => u.id === user.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...updates, updatedAt: updatedUser.updatedAt };
          localStorage.setItem('repodock_users', JSON.stringify(users));
        }
      },

      checkAuthStatus: () => {
        const storedUser = localDB.getUser();
        if (storedUser) {
          set({
            user: storedUser,
            isAuthenticated: true,
          });
        }
      },
    }),
    {
      name: 'repodock-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
