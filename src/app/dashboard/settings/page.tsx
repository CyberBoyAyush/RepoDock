// Location: src/app/dashboard/settings/page.tsx
// Description: Settings page for RepoDock.dev - user profile, encryption settings, and preferences

'use client';

import { useState } from 'react';
import { User, Key, Shield, Save, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { encryptionService } from '@/lib/encryption';
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast';

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
    username: user?.username || '',
    email: user?.email || '',
  });

  // Encryption form state
  const [encryptionData, setEncryptionData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      updateUser({
        username: profileData.username,
        email: profileData.email,
      });

      showSuccessToast('Profile Updated', 'Your profile has been updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      showErrorToast('Update Failed', 'Failed to update profile. Please try again.');
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'profile'
              ? 'bg-background text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="w-4 h-4 inline mr-2" />
          Profile
        </button>
        <button
          onClick={() => setActiveTab('encryption')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'encryption'
              ? 'bg-background text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="w-4 h-4 inline mr-2" />
          Encryption
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center mb-6">
            <User className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={profileData.username}
                onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used for encryption key generation
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Encryption Tab */}
      {activeTab === 'encryption' && (
        <div className="space-y-6">
          {/* Encryption Settings */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Key className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-semibold">Encryption Settings</h2>
            </div>

            <form onSubmit={handleEncryptionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">New Encryption Password</label>
                <div className="relative">
                  <input
                    type={showEncryptionPassword ? 'text' : 'password'}
                    value={encryptionData.newPassword}
                    onChange={(e) => setEncryptionData(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new encryption password"
                    className="w-full px-3 py-2 pr-10 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowEncryptionPassword(!showEncryptionPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showEncryptionPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used to encrypt/decrypt environment variables
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type={showEncryptionPassword ? 'text' : 'password'}
                  value={encryptionData.confirmPassword}
                  onChange={(e) => setEncryptionData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new encryption password"
                  className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={testEncryption}
                  disabled={encryptionTestResult.status === 'testing'}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {encryptionTestResult.status === 'testing' ? 'Testing...' : 'Test Encryption'}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>

              {/* Encryption Test Result */}
              {encryptionTestResult.status !== 'idle' && (
                <div className={`mt-4 p-3 rounded-lg border ${
                  encryptionTestResult.status === 'success'
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : encryptionTestResult.status === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                    : 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                }`}>
                  <div className="flex items-center">
                    {encryptionTestResult.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                    )}
                    {encryptionTestResult.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    )}
                    {encryptionTestResult.status === 'testing' && (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    )}
                    <span className={`text-sm font-medium ${
                      encryptionTestResult.status === 'success'
                        ? 'text-green-800 dark:text-green-200'
                        : encryptionTestResult.status === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {encryptionTestResult.message}
                    </span>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Encryption Info */}
          <div className="bg-muted/50 border border-border rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Shield className="w-5 h-5 mr-2" />
              <h3 className="text-md font-semibold">Encryption Information</h3>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Algorithm:</span>
                <span className="font-mono">AES-256-CBC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Key Derivation:</span>
                <span className="font-mono">PBKDF2 (10,000 iterations)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Key Source:</span>
                <span className="font-mono">Email + Encryption Password</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage:</span>
                <span className="font-mono">Local Browser + Database</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Cross-Device Access:</strong> You can access your encrypted environment variables
                  from any device by logging in with the same account and entering the same encryption password.
                </p>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-xs text-green-700 dark:text-green-300">
                  <strong>Privacy Notice:</strong> We do <strong>NOT</strong> store encryption passwords on servers.
                  Your password is stored in your local browser only. Do not forget it - lost passwords cannot be recovered.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
