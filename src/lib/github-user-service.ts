// Location: src/lib/github-user-service.ts
// Description: Service for managing user-specific GitHub App installations

import { database } from '@/lib/database';
import { createGitHubAppService, getAllInstallations, findInstallationByUsername } from '@/lib/github-app';

interface UserGitHubInstallation {
  installationId: string;
  githubUsername: string;
  accountType: 'User' | 'Organization';
  avatarUrl?: string;
  createdAt: Date;
}

export class GitHubUserService {
  
  // Get or create GitHub installation for a user
  static async getOrCreateUserInstallation(userId: string, githubUsername?: string): Promise<UserGitHubInstallation | null> {
    try {
      // First, check if user already has an installation stored
      const user = await database.getUser(userId);
      if (user?.githubInstallationId && user?.githubUsername) {
        return {
          installationId: user.githubInstallationId,
          githubUsername: user.githubUsername,
          accountType: 'User', // We'll determine this later if needed
          createdAt: user.githubInstallationCreatedAt ? new Date(user.githubInstallationCreatedAt) : new Date(),
        };
      }

      // If no stored installation, try to find one
      let installationId: string | null = null;

      if (githubUsername) {
        // Try to find installation by provided username
        installationId = await findInstallationByUsername(githubUsername);
      } else {
        // Try to auto-detect from user's email or other methods
        installationId = await this.autoDetectUserInstallation(user?.email);
      }

      if (!installationId) {
        return null; // No installation found
      }

      // Get installation details
      const installations = await getAllInstallations();
      const installation = installations.find((inst: any) => inst.id.toString() === installationId);
      
      if (!installation) {
        return null;
      }

      const userInstallation: UserGitHubInstallation = {
        installationId,
        githubUsername: installation.account.login,
        accountType: installation.account.type,
        avatarUrl: installation.account.avatar_url,
        createdAt: new Date(installation.created_at),
      };

      // Store in database
      await database.updateUser(userId, {
        githubUsername: userInstallation.githubUsername,
        githubInstallationId: installationId,
        githubInstallationCreatedAt: userInstallation.createdAt,
      });

      return userInstallation;
    } catch (error) {
      console.error('Failed to get or create user installation:', error);
      return null;
    }
  }

  // Auto-detect user installation (can be enhanced with more logic)
  private static async autoDetectUserInstallation(_userEmail?: string): Promise<string | null> {
    try {
      const installations = await getAllInstallations();

      // For now, just return the first installation
      // In the future, you could match by email domain, organization membership, etc.
      if (installations.length > 0) {
        return installations[0].id.toString();
      }

      return null;
    } catch (error) {
      console.error('Failed to auto-detect installation:', error);
      return null;
    }
  }

  // Get GitHub service for a specific user
  static async getGitHubServiceForUser(userId: string, githubUsername?: string): Promise<ReturnType<typeof createGitHubAppService> | null> {
    try {
      const installation = await this.getOrCreateUserInstallation(userId, githubUsername);
      if (!installation) {
        return null;
      }

      return createGitHubAppService(installation.installationId);
    } catch (error) {
      console.error('Failed to get GitHub service for user:', error);
      return null;
    }
  }

  // Check if user has GitHub App installed
  static async hasGitHubInstallation(userId: string): Promise<boolean> {
    try {
      const installation = await this.getOrCreateUserInstallation(userId);
      return !!installation;
    } catch (error) {
      console.error('Failed to check GitHub installation:', error);
      return false;
    }
  }

  // Get all available installations (for admin/debug purposes)
  static async getAllAvailableInstallations(): Promise<any[]> {
    try {
      return await getAllInstallations();
    } catch (error) {
      console.error('Failed to get all installations:', error);
      return [];
    }
  }

  // Remove user's GitHub installation
  static async removeUserInstallation(userId: string): Promise<void> {
    try {
      await database.updateUser(userId, {
        githubUsername: undefined,
        githubInstallationId: undefined,
        githubInstallationCreatedAt: undefined,
      });
    } catch (error) {
      console.error('Failed to remove user installation:', error);
      throw error;
    }
  }

  // Refresh user's installation (re-detect and update)
  static async refreshUserInstallation(userId: string, githubUsername?: string): Promise<UserGitHubInstallation | null> {
    try {
      // Remove existing installation
      await this.removeUserInstallation(userId);
      
      // Re-detect and create
      return await this.getOrCreateUserInstallation(userId, githubUsername);
    } catch (error) {
      console.error('Failed to refresh user installation:', error);
      return null;
    }
  }
}

// Helper function for API routes
export async function getGitHubServiceForCurrentUser(userId: string): Promise<ReturnType<typeof createGitHubAppService> | null> {
  return await GitHubUserService.getGitHubServiceForUser(userId);
}
