// Location: src/app/dashboard/settings/page.tsx
// Description: Settings page for RepoDock.dev - user profile, encryption settings, and preferences

'use client';

import { useState, useEffect } from 'react';
import { User, Key, Shield, Save, Eye, EyeOff, CheckCircle, AlertCircle, Settings as SettingsIcon, Lock, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/features/auth/useAuth';
import { encryptionService } from '@/lib/encryption';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showEncryptionPassword, setShowEncryptionPassword] = useState(false);
  const [encryptionTestResult, setEncryptionTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
  });

  // Encryption form state
  const [encryptionData, setEncryptionData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Sync form state with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const success = await updateUser({
        name: profileData.name,
      });

      if (success) {
        showSuccessToast('Name Updated', 'Your display name has been updated successfully!');
      } else {
        showErrorToast('Update Failed', 'Failed to update name. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      showErrorToast('Update Failed', 'Failed to update name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncryptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (encryptionData.newPassword !== encryptionData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (!encryptionData.newPassword) {
      alert('Please enter a new encryption password');
      return;
    }

    setIsLoading(true);
    try {
      // Set the new encryption password
      encryptionService.setUserEncryptionPassword(user.email, encryptionData.newPassword);
      
      // Clear form
      setEncryptionData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      showSuccessToast('Password Updated', 'Encryption password updated successfully!');
    } catch (error) {
      console.error('Failed to update encryption password:', error);
      showErrorToast('Update Failed', 'Failed to update encryption password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const testEncryption = async () => {
    if (!user) return;

    setEncryptionTestResult({ status: 'testing', message: 'Testing encryption...' });

    try {
      const testValue = 'test-encryption-123';
      const encrypted = await encryptionService.encryptEnvValueWithUser(testValue, user.email);
      const decrypted = await encryptionService.decryptEnvValueWithUser(encrypted, user.email);

      if (decrypted === testValue) {
        setEncryptionTestResult({
          status: 'success',
          message: 'Encryption test PASSED! Your encryption is working correctly.'
        });
      } else {
        setEncryptionTestResult({
          status: 'error',
          message: 'Encryption test FAILED! Please check your encryption password.'
        });
      }
    } catch (error) {
      setEncryptionTestResult({
        status: 'error',
        message: 'Encryption test FAILED! Error: ' + (error as Error).message
      });
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('encryption')}
            className={cn(
              'flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
              activeTab === 'encryption'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Key className="w-4 h-4" />
            <span>Encryption</span>
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid gap-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Profile Information</span>
                </CardTitle>
                <CardDescription>
                  Update your display name and view your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className={cn(
                          'w-full px-3 py-2.5 border border-input rounded-lg text-sm',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                          'transition-colors duration-150'
                        )}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className={cn(
                          'w-full px-3 py-2.5 border border-input rounded-lg text-sm',
                          'bg-muted/50 text-muted-foreground cursor-not-allowed',
                          'focus:outline-none'
                        )}
                        placeholder="No email address"
                      />
                      <p className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>Email cannot be changed as it's used for encryption key generation</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-border/50">
                    <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Updating...' : 'Update Name'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Encryption Tab */}
        {activeTab === 'encryption' && (
          <div className="grid gap-6">
            {/* Encryption Settings */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-primary" />
                  <span>Encryption Settings</span>
                </CardTitle>
                <CardDescription>
                  Set up your encryption password to secure environment variables
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEncryptionSubmit} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        New Encryption Password
                      </label>
                      <div className="relative">
                        <input
                          type={showEncryptionPassword ? 'text' : 'password'}
                          value={encryptionData.newPassword}
                          onChange={(e) => setEncryptionData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new encryption password"
                          className={cn(
                            'w-full px-3 py-2.5 pr-10 border border-input rounded-lg text-sm',
                            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                            'transition-colors duration-150'
                          )}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowEncryptionPassword(!showEncryptionPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showEncryptionPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Used to encrypt/decrypt environment variables</span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Confirm New Password
                      </label>
                      <input
                        type={showEncryptionPassword ? 'text' : 'password'}
                        value={encryptionData.confirmPassword}
                        onChange={(e) => setEncryptionData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new encryption password"
                        className={cn(
                          'w-full px-3 py-2.5 border border-input rounded-lg text-sm',
                          'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                          'transition-colors duration-150'
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={testEncryption}
                      disabled={encryptionTestResult.status === 'testing'}
                      className="min-w-[120px]"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {encryptionTestResult.status === 'testing' ? 'Testing...' : 'Test Encryption'}
                    </Button>
                    <Button type="submit" disabled={isLoading} className="min-w-[120px]">
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>

                  {/* Encryption Test Result */}
                  {encryptionTestResult.status !== 'idle' && (
                    <div className={cn(
                      'p-4 rounded-lg border',
                      encryptionTestResult.status === 'success' && 'bg-green-100/80 border-green-300 dark:bg-green-950/20 dark:border-green-800',
                      encryptionTestResult.status === 'error' && 'bg-red-100/80 border-red-300 dark:bg-red-950/20 dark:border-red-800',
                      encryptionTestResult.status === 'testing' && 'bg-blue-100/80 border-blue-300 dark:bg-blue-950/20 dark:border-blue-800'
                    )}>
                      <div className="flex items-center space-x-2">
                        {encryptionTestResult.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400" />
                        )}
                        {encryptionTestResult.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-700 dark:text-red-400" />
                        )}
                        {encryptionTestResult.status === 'testing' && (
                          <div className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                        )}
                        <span className={cn(
                          'text-sm font-medium',
                          encryptionTestResult.status === 'success' && 'text-green-900 dark:text-green-200',
                          encryptionTestResult.status === 'error' && 'text-red-900 dark:text-red-200',
                          encryptionTestResult.status === 'testing' && 'text-blue-900 dark:text-blue-200'
                        )}>
                          {encryptionTestResult.message}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Encryption Information */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-primary" />
                  <span>Encryption Information</span>
                </CardTitle>
                <CardDescription>
                  Technical details about how your data is encrypted and secured
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Algorithm</span>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">AES-256-CBC</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Key Derivation</span>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">PBKDF2 (10,000)</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Key Source</span>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">Email + Password</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Storage</span>
                        <span className="text-sm font-mono bg-muted px-2 py-1 rounded">Local + Database</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="p-4 bg-blue-200/60 dark:bg-blue-950/20 border border-blue-400/60 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-700 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                            Cross-Device Access
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-300">
                            Access your encrypted environment variables from any device by logging in with the same account and encryption password.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-200/60 dark:bg-green-950/20 border border-green-400/60 dark:border-green-800 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-green-700 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-200 mb-1">
                            Privacy Notice
                          </p>
                          <p className="text-xs text-green-800 dark:text-green-300">
                            We do <strong>NOT</strong> store encryption passwords on servers. Your password is stored locally only. Lost passwords cannot be recovered.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
