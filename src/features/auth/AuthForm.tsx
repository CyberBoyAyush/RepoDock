// Location: src/features/auth/AuthForm.tsx
// Description: Authentication form component for RepoDock.dev - handles both login and signup forms with validation, error handling, and modern UI design

'use client';

import * as React from 'react';
import { useState } from 'react';
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
  const [currentMode, setCurrentMode] = useState<'login' | 'signup'>(mode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { login, signup, isLoading, error, clearError } = useAuth();

  const handleModeChange = (newMode: 'login' | 'signup') => {
    setCurrentMode(newMode);
    setFormData({
      username: '',
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
          username: formData.username,
          password: formData.password,
        } as LoginFormData);
        
        if (success) {
          // Redirect will be handled by the auth state change
        }
      } else {
        const success = await signup({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        } as SignupFormData);
        
        if (success) {
          // Redirect will be handled by the auth state change
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
    <div className={cn('w-full max-w-md space-y-6', className)}>
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentMode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentMode === 'login' 
            ? 'Enter your credentials to access your workspace' 
            : 'Enter your details to get started with RepoDock'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Username"
          type="text"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          error={errors.username}
          placeholder="Enter your username"
          required
          autoComplete="username"
        />

        {currentMode === 'signup' && (
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
        )}

        <Input
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
          placeholder="Enter your password"
          required
          autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
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
          />
        )}

        {error && (
          <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
          disabled={isLoading}
        >
          {currentMode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => handleModeChange(currentMode === 'login' ? 'signup' : 'login')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          {currentMode === 'login' 
            ? "Don't have an account? Sign up" 
            : 'Already have an account? Sign in'
          }
        </button>
      </div>

      {currentMode === 'login' && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Demo credentials: username: <code className="bg-muted px-1 rounded">demo</code>, password: <code className="bg-muted px-1 rounded">demo123</code>
          </p>
        </div>
      )}
    </div>
  );
}
