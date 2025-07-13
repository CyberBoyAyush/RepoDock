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
          disabled={isLoading}
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
            disabled={isLoading}
          >
            {currentMode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>


    </div>
  );
}
