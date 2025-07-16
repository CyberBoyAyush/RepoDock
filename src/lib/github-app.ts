// Location: src/lib/github-app.ts
// Description: GitHub App service for RepoDock.dev - handles GitHub API interactions using GitHub App authentication instead of OAuth

import { GitHubRepository, GitHubIssue, GitHubPullRequest } from '@/types';
import { sign } from 'jsonwebtoken';

interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  installationId?: string;
}

interface CreateIssueData {
  title: string;
  body?: string;
  assignees?: string[];
  labels?: string[];
  milestone?: number;
}

interface GitHubAppApiResponse<T> {
  data: T;
  rateLimit: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

class GitHubAppError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitHubAppError';
  }
}

export class GitHubAppService {
  private appId: string;
  private privateKey: string;
  private installationId?: string;
  private baseUrl: string = 'https://api.github.com';
  private installationToken?: string;
  private tokenExpiry?: number;

  constructor(config: GitHubAppConfig) {
    this.appId = config.appId;
    this.privateKey = config.privateKey;
    this.installationId = config.installationId;
  }

  private generateJWT(): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iat: now - 60, // Issued 60 seconds in the past to account for clock drift
      exp: now + 600, // Expires in 10 minutes
      iss: this.appId,
    };

    return sign(payload, this.privateKey, { algorithm: 'RS256' });
  }

  private async getInstallationToken(): Promise<string> {
    // Return cached token if still valid
    if (this.installationToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.installationToken;
    }

    if (!this.installationId) {
      throw new GitHubAppError('Installation ID not configured', 400);
    }

    const jwt = this.generateJWT();
    
    const response = await fetch(
      `${this.baseUrl}/app/installations/${this.installationId}/access_tokens`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'RepoDock/1.0',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || `Failed to get installation token: ${response.status}`;

      // Provide more helpful error messages
      if (response.status === 404) {
        errorMessage = `Installation not found (404). Please check:
1. GITHUB_APP_INSTALLATION_ID is correct
2. GitHub App is installed on your account/organization
3. Use /api/github/installations to find the correct installation ID`;
      } else if (response.status === 401) {
        errorMessage = `Authentication failed (401). Please check:
1. GITHUB_APP_ID is correct
2. GITHUB_APP_PRIVATE_KEY is valid and properly formatted
3. Private key matches the GitHub App`;
      }

      throw new GitHubAppError(errorMessage, response.status, errorData);
    }

    const data = await response.json();
    const token = data.token as string;
    this.installationToken = token;
    this.tokenExpiry = new Date(data.expires_at).getTime() - 60000; // Expire 1 minute early

    return token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GitHubAppApiResponse<T>> {
    const token = await this.getInstallationToken();
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'RepoDock/1.0',
        ...options.headers,
      },
    });

    // Extract rate limit information
    const rateLimit = {
      limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
    };

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new GitHubAppError(
        errorData.message || `GitHub API error: ${response.status}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return { data, rateLimit };
  }

  // Get repository by owner and name
  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    const response = await this.makeRequest<GitHubRepository>(`/repos/${owner}/${repo}`);
    return response.data;
  }

  // Get issues for a specific repository
  async getRepositoryIssues(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
    page = 1,
    perPage = 100
  ): Promise<GitHubIssue[]> {
    const response = await this.makeRequest<GitHubIssue[]>(
      `/repos/${owner}/${repo}/issues?state=${state}&page=${page}&per_page=${perPage}&sort=updated&direction=desc`
    );
    // Filter out pull requests (GitHub API returns PRs in issues endpoint)
    return response.data.filter(issue => !issue.pull_request);
  }

  // Get user-specific issues (assigned to or created by user)
  async getUserIssues(
    owner: string,
    repo: string,
    githubUsername: string,
    state: 'open' | 'closed' | 'all' = 'open',
    prioritizeOpen = true
  ): Promise<GitHubIssue[]> {
    const allIssues: GitHubIssue[] = [];

    // If prioritizing open, fetch open first, then closed
    const states = prioritizeOpen && state === 'all' ? ['open', 'closed'] : [state];

    for (const currentState of states) {
      // Fetch issues assigned to user
      try {
        const assignedResponse = await this.makeRequest<GitHubIssue[]>(
          `/repos/${owner}/${repo}/issues?assignee=${githubUsername}&state=${currentState}&per_page=100&sort=updated&direction=desc`
        );
        // Filter out pull requests (GitHub API returns PRs in issues endpoint)
        const actualIssues = assignedResponse.data.filter(issue => !issue.pull_request);
        allIssues.push(...actualIssues);
      } catch (error) {
        // Silent error handling
      }

      // Fetch issues created by user
      try {
        const createdResponse = await this.makeRequest<GitHubIssue[]>(
          `/repos/${owner}/${repo}/issues?creator=${githubUsername}&state=${currentState}&per_page=100&sort=updated&direction=desc`
        );
        // Filter out pull requests (GitHub API returns PRs in issues endpoint)
        const actualIssues = createdResponse.data.filter(issue => !issue.pull_request);
        allIssues.push(...actualIssues);
      } catch (error) {
        // Silent error handling
      }
    }

    // Remove duplicates based on issue ID
    const uniqueIssues = allIssues.filter((issue, index, self) =>
      index === self.findIndex(i => i.id === issue.id)
    );

    // Sort by updated date (most recent first)
    return uniqueIssues.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  // Get pull requests for a specific repository
  async getRepositoryPullRequests(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open',
    page = 1,
    perPage = 100
  ): Promise<GitHubPullRequest[]> {
    const response = await this.makeRequest<GitHubPullRequest[]>(
      `/repos/${owner}/${repo}/pulls?state=${state}&page=${page}&per_page=${perPage}&sort=updated&direction=desc`
    );
    return response.data;
  }

  // Get user-specific pull requests (authored by or assigned to user)
  async getUserPullRequests(
    owner: string,
    repo: string,
    githubUsername: string,
    state: 'open' | 'closed' | 'all' = 'open',
    prioritizeOpen = true
  ): Promise<GitHubPullRequest[]> {
    const allPRs: GitHubPullRequest[] = [];

    // If prioritizing open, fetch open first, then closed
    const states = prioritizeOpen && state === 'all' ? ['open', 'closed'] : [state];

    for (const currentState of states) {
      try {
        // Fetch all PRs for the repository in this state
        const response = await this.makeRequest<GitHubPullRequest[]>(
          `/repos/${owner}/${repo}/pulls?state=${currentState}&per_page=100&sort=updated&direction=desc`
        );

        // Filter PRs that are authored by or assigned to the user
        const userPRs = response.data.filter(pr => {
          const isAuthor = pr.user.login === githubUsername;
          const isAssigned = pr.assignees?.some(assignee => assignee.login === githubUsername);
          const isRequestedReviewer = pr.requested_reviewers?.some(reviewer => reviewer.login === githubUsername);

          return isAuthor || isAssigned || isRequestedReviewer;
        });

        allPRs.push(...userPRs);
      } catch (error) {
        // Silent error handling
      }
    }

    // Remove duplicates and sort by updated date
    const uniquePRs = allPRs.filter((pr, index, self) =>
      index === self.findIndex(p => p.id === pr.id)
    );

    return uniquePRs.sort((a, b) =>
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }

  // Create a new issue
  async createIssue(
    owner: string,
    repo: string,
    issueData: CreateIssueData
  ): Promise<GitHubIssue> {
    const response = await this.makeRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        body: JSON.stringify(issueData),
      }
    );
    return response.data;
  }

  // Update an existing issue
  async updateIssue(
    owner: string,
    repo: string,
    issueNumber: number,
    issueData: Partial<CreateIssueData & { state: 'open' | 'closed' }>
  ): Promise<GitHubIssue> {
    const response = await this.makeRequest<GitHubIssue>(
      `/repos/${owner}/${repo}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        body: JSON.stringify(issueData),
      }
    );
    return response.data;
  }

  // Get repository labels
  async getRepositoryLabels(owner: string, repo: string): Promise<unknown[]> {
    const response = await this.makeRequest<unknown[]>(`/repos/${owner}/${repo}/labels`);
    return response.data;
  }

  // Get repository milestones
  async getRepositoryMilestones(
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<unknown[]> {
    const response = await this.makeRequest<unknown[]>(
      `/repos/${owner}/${repo}/milestones?state=${state}`
    );
    return response.data;
  }

  // Get repository collaborators
  async getRepositoryCollaborators(owner: string, repo: string): Promise<unknown[]> {
    const response = await this.makeRequest<unknown[]>(
      `/repos/${owner}/${repo}/collaborators`
    );
    return response.data;
  }

  // Get accessible repositories for the installation
  async getAccessibleRepositories(): Promise<GitHubRepository[]> {
    const response = await this.makeRequest<{ repositories: GitHubRepository[] }>(
      '/installation/repositories'
    );
    return response.data.repositories;
  }

  // Check rate limit
  async getRateLimit(): Promise<unknown> {
    const response = await this.makeRequest<unknown>('/rate_limit');
    return response.data;
  }
}

// Helper function to create GitHub App service instance
export function createGitHubAppService(installationId?: string): GitHubAppService {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new GitHubAppError('GitHub App credentials not configured. Please set GITHUB_APP_ID and GITHUB_APP_PRIVATE_KEY in your environment variables.', 500);
  }

  if (!installationId) {
    throw new GitHubAppError('Installation ID is required. This should be provided dynamically based on the user.', 400);
  }

  return new GitHubAppService({
    appId,
    privateKey,
    installationId,
  });
}

// Helper function to get all installations for the GitHub App
export async function getAllInstallations(): Promise<any[]> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new GitHubAppError('GitHub App credentials not configured', 500);
  }

  // Generate JWT for GitHub App authentication
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: appId,
  };

  const jwt = sign(payload, privateKey, { algorithm: 'RS256' });

  // Get all installations
  const response = await fetch('https://api.github.com/app/installations', {
    headers: {
      'Authorization': `Bearer ${jwt}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RepoDock/1.0',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new GitHubAppError(
      errorData.message || `Failed to fetch installations: ${response.status}`,
      response.status,
      errorData
    );
  }

  return await response.json();
}

// Helper function to find installation by GitHub username
export async function findInstallationByUsername(githubUsername: string): Promise<string | null> {
  try {
    const installations = await getAllInstallations();
    const installation = installations.find((inst: any) =>
      inst.account.login.toLowerCase() === githubUsername.toLowerCase()
    );
    return installation ? installation.id.toString() : null;
  } catch (error) {
    return null;
  }
}

// Helper function to parse repository URL/name
export function parseRepositoryIdentifier(repository: string): { owner: string; repo: string } | null {
  // Handle different formats:
  // - "owner/repo"
  // - "https://github.com/owner/repo"
  // - "https://github.com/owner/repo.git"

  let match;

  // GitHub URL format
  match = repository.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  // Simple owner/repo format
  match = repository.match(/^([^\/]+)\/([^\/]+)$/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }

  return null;
}

// Helper function to format repository URL for links
export function formatRepositoryUrl(repository: string): string {
  if (repository.startsWith('http')) {
    return repository;
  }
  return `https://github.com/${repository}`;
}

export { GitHubAppError };
