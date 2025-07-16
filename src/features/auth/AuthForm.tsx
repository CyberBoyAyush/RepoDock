// Location: src/features/auth/AuthForm.tsx
// Description: Authentication form component for RepoDock.dev - handles both login and signup forms with validation, error handling, and modern UI design

'use client';

import * as React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from './useAuth';
import { loginSchema, signupSchema, type LoginFormData, type SignupFormData } from '@/lib/zodSchemas';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';

interface AuthFormProps {
  mode?: 'login' | 'signup';
  onModeChange?: (mode: 'login' | 'signup') => void;
  className?: string;
}

export function AuthForm({ mode = 'login', onModeChange, className }: AuthFormProps) {
  const router = useRouter();
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>(mode);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { login, signup, validateSession, isLoading, error, clearError } = useAuth();
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setCurrentMode(newMode);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    clearError();
    onModeChange?.(newMode);
  };

  const validateForm = () => {
    const schema = currentMode === 'login' ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      if (result.error?.issues) {
        result.error.issues.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
      }
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (currentMode === 'login') {
        const success = await login({
          email: formData.email,
          password: formData.password,
        } as LoginFormData);

        if (success) {
          // Validate session before redirect
          const sessionValid = await validateSession();
          console.log('Login session validation:', sessionValid);

          // Redirect to dashboard after successful login
          router.push('/dashboard');
        }
      } else {
        const success = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        } as SignupFormData);

        if (success) {
          // Validate session before redirect
          const sessionValid = await validateSession();
          console.log('Signup session validation:', sessionValid);

          // Redirect to dashboard after successful signup
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear global error
    if (error) {
      clearError();
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      setSocialLoading(provider);
      clearError();

      await authClient.signIn.social({
        provider,
        callbackURL: '/dashboard',
      });

      // The redirect will happen automatically after successful authentication
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setSocialLoading(null);
      // The error will be handled by the auth client and displayed in the UI
    }
  };

  return (
    <div className={cn('w-full max-w-md space-y-8', className)}>
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
          {currentMode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="text-muted-foreground">
          {currentMode === 'login'
            ? 'Sign in to access your workspace and continue building'
            : 'Join RepoDock and start managing your projects efficiently'
          }
        </p>
      </div>

      {/* Social Login Buttons */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading || socialLoading !== null}
            loading={socialLoading === 'google'}
            className="h-12 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 hover:border-border transition-all duration-200"
          >
            {socialLoading === 'google' ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            <span className="ml-2 text-sm font-medium">Google</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading || socialLoading !== null}
            loading={socialLoading === 'github'}
            className="h-12 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 hover:border-border transition-all duration-200"
          >
            {socialLoading === 'github' ? (
              <div className="w-5 h-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            )}
            <span className="ml-2 text-sm font-medium">GitHub</span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {currentMode === 'signup' && (
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={errors.name}
            placeholder="Enter your full name"
            required
            autoComplete="name"
            className="transition-all duration-200"
          />
        )}

        <Input
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          placeholder="Enter your email address"
          required
          autoComplete="email"
          className="transition-all duration-200"
        />

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          required
          autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
          className="transition-all duration-200"
        />

        {currentMode === 'signup' && (
          <Input
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
            autoComplete="new-password"
            className="transition-all duration-200"
          />
        )}

        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Authentication Error</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          loading={isLoading}
          disabled={isLoading || socialLoading !== null}
        >
          {isLoading ? (
            currentMode === 'login' ? 'Signing you in...' : 'Creating your account...'
          ) : (
            <>
              {currentMode === 'login' ? 'Sign in to RepoDock' : 'Create your account'}
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </Button>
      </form>

      {/* Mode Toggle */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {currentMode === 'login'
            ? "Don't have an account?"
            : 'Already have an account?'
          }
          {' '}
          <button
            type="button"
            onClick={() => handleModeChange(currentMode === 'login' ? 'signup' : 'login')}
            className="font-medium text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
            disabled={isLoading || socialLoading !== null}
          >
            {currentMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>


    </div>
  );
}
