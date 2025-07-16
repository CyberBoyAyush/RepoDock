# GitHub App Integration Setup Guide for RepoDock

This guide will help you set up GitHub App integration in RepoDock to enable fetching PRs and issues, as well as creating issues directly from the application.

## Overview

The GitHub App integration provides the following features:
- **Fetch Pull Requests**: View PRs from accessible repositories
- **Fetch Issues**: View issues from accessible repositories
- **Create Issues**: Create new issues directly from RepoDock
- **Repository Access**: Access to all repositories where the app is installed
- **Higher Rate Limits**: 5000 requests/hour per installation
- **No User OAuth Required**: Separate from user authentication

## Prerequisites

1. **GitHub App**: You need a GitHub App configured
2. **Database Schema**: Updated Prisma schema with GitHub-specific fields
3. **Environment Variables**: GitHub App credentials in your `.env` file

## Step 1: GitHub App Setup

### Create GitHub App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **GitHub Apps** > **New GitHub App**
3. Fill in the application details:
   - **GitHub App name**: `repodock` (or your preferred name)
   - **Description**: `RepoDock GitHub integration for PR and issue management`
   - **Homepage URL**:
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Webhook URL**: Leave blank (not needed for this integration)
   - **Webhook secret**: Leave blank

4. **Permissions** - Set the following repository permissions:
   - **Issues**: Read & Write
   - **Pull requests**: Read
   - **Metadata**: Read
   - **Contents**: Read (optional, for file access)

5. **Where can this GitHub App be installed?**
   - Select "Any account" for public use
   - Or "Only on this account" for private use

6. Click **Create GitHub App**
7. After creation, note down the **App ID**
8. Generate and download a **Private Key** (PEM format)

### Install the GitHub App

1. After creating the app, go to the app's page
2. Click **Install App** in the left sidebar
3. Choose the account/organization to install on
4. Select repositories (All repositories or Selected repositories)
5. Click **Install**

### Get Installation ID

After installing the app, you need to get the Installation ID:

**Method 1: From URL**
- After installation, check the URL: `https://github.com/settings/installations/12345678`
- The number at the end (`12345678`) is your Installation ID

**Method 2: Using API Endpoint**
- Set up your App ID and Private Key first
- Visit: `http://localhost:3000/api/github/installations`
- Copy the `id` from the installation you want to use

## Step 2: Environment Variables

Add the following to your `.env` file:

```env
# GitHub App Configuration
GITHUB_APP_ID=your-app-id-here
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
your-private-key-content-here
-----END RSA PRIVATE KEY-----"
# Note: Installation ID is now automatically detected per user

# For frontend (optional - for GitHub App installation link)
NEXT_PUBLIC_GITHUB_APP_NAME=repodock

# Better Auth Configuration (if not already set)
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000  # Change for production

# Database Configuration
DATABASE_URL=your-postgresql-connection-string
```

### Important Notes:
- **Private Key**: Copy the entire content of the downloaded PEM file, including the header and footer
- **Installation ID**: No longer needed! The system automatically detects installations per user
- **App Name**: Use the exact name you gave your GitHub App (for installation links)
- **Multi-User Support**: Each user can install the app independently and access their own repositories

## Step 3: Database Schema

The implementation includes updated Prisma schema with GitHub-specific fields. Run the following to apply changes:

```bash
# Push schema changes to database
pnpm prisma db push

# Generate Prisma client
pnpm prisma generate
```

### New Schema Fields

**Project Model:**
- `githubRepoId` - GitHub repository ID
- `githubOwner` - Repository owner/organization
- `githubRepo` - Repository name

**PullRequest Model:**
- `githubId` - GitHub PR ID
- `sourceBranch` - Source branch name
- `targetBranch` - Target branch name
- `author` - GitHub username of PR author
- `authorAvatar` - GitHub avatar URL
- `labels` - JSON string of GitHub labels
- `assignees` - JSON string of GitHub assignees
- `reviewers` - JSON string of GitHub reviewers
- `isDraft` - Whether PR is draft
- `mergeable` - Whether PR can be merged
- `additions` - Lines added
- `deletions` - Lines deleted
- `changedFiles` - Number of files changed

**Issue Model:**
- `githubId` - GitHub issue ID
- `author` - GitHub username of issue author
- `authorAvatar` - GitHub avatar URL
- `assignees` - JSON string of GitHub assignees
- `labels` - JSON string of GitHub labels
- `milestone` - GitHub milestone
- `state` - GitHub state (open, closed)
- `stateReason` - GitHub state reason
- `comments` - Number of comments
- `reactions` - JSON string of GitHub reactions
- `locked` - Whether issue is locked

## Step 4: Testing the Integration

### 1. Start Development Server

1. Start your development server: `pnpm dev`
2. Go to any project in RepoDock
3. Navigate to the "Pull Requests" or "Issues" tab

### 2. GitHub App Status Check

The system will automatically check if the GitHub App is properly configured and can access repositories.

### 3. Repository Connection

1. Navigate to a project in RepoDock
2. Go to the "Pull Requests" tab
3. Use the Repository Connection component to:
   - Connect via repository URL (e.g., `owner/repo` or `https://github.com/owner/repo`)
   - Or select from accessible repositories (where the GitHub App is installed)

### 4. Pull Requests

1. After connecting a repository, the PR tab will show:
   - All pull requests from the connected repository
   - PR status, author, branches, and statistics
   - Filter by status: All, Open, Closed, Merged, Draft
   - Links to view PRs on GitHub

### 5. Issues

1. The Issues tab provides:
   - List of all issues from the connected repository
   - Create new issues directly from RepoDock
   - Filter by status (Open, Closed) and priority (Urgent, High, Medium, Low)
   - Issue status, priority, and type management
   - Automatic GitHub synchronization

## Step 5: Testing and Troubleshooting

### Common Issues and Solutions

#### 1. "GitHub App not installed"
**Problem**: User hasn't installed the GitHub App
**Solution**:
- Click "Install GitHub App" button in the UI
- Install the app on your GitHub account/organization
- System will automatically detect the installation

#### 2. "Failed to fetch repositories"
**Problem**: GitHub App credentials are incorrect
**Solution**:
- Verify `GITHUB_APP_ID` matches your GitHub App
- Ensure `GITHUB_APP_PRIVATE_KEY` is the complete PEM content
- Check that the private key belongs to the correct GitHub App
- Restart your development server after updating environment variables

#### 3. "No repositories found"
**Problem**: App doesn't have access to repositories
**Solution**:
- Go to GitHub App installation settings
- Grant access to repositories
- Check app permissions (Issues: Read & Write, Pull requests: Read)

#### 4. Private Key Format Issues
**Correct Format**:
```env
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
(multiple lines of key content)
...
-----END RSA PRIVATE KEY-----"
```

**Important**: Include the entire key with headers and footers in quotes.

## API Endpoints

The implementation includes the following API endpoints:

### GitHub Integration
- `GET /api/github/repositories` - Get user's GitHub repositories

### Project Management
- `PUT /api/projects/[id]` - Update project (including repository connection)

### Pull Requests
- `GET /api/projects/[id]/pull-requests` - Get PRs for project
- `POST /api/projects/[id]/pull-requests` - Create PR (local only)

### Issues
- `GET /api/projects/[id]/issues` - Get issues for project
- `POST /api/projects/[id]/issues` - Create issue (GitHub + local)
- `GET /api/issues/[id]` - Get specific issue
- `PUT /api/issues/[id]` - Update issue
- `DELETE /api/issues/[id]` - Delete issue (local only)

## Features

### Repository Connection
- **Automatic Discovery**: Browse and select from user's GitHub repositories
- **Manual Connection**: Connect via repository URL or owner/repo format
- **Connection Status**: Visual indicators for connection status
- **Disconnect Option**: Easily disconnect repositories

### Pull Request Management
- **Real-time Sync**: Automatic synchronization with GitHub
- **Rich Display**: Shows PR status, author, branches, and statistics
- **GitHub Links**: Direct links to view PRs on GitHub
- **Status Indicators**: Visual badges for PR status (open, closed, merged, draft)

### Issue Management
- **Create Issues**: Create issues directly from RepoDock
- **GitHub Sync**: Issues created on GitHub are automatically synced
- **Priority & Type**: Local priority and type management
- **Assignment**: Assign issues to GitHub users
- **Status Tracking**: Track issue status and progress

## Troubleshooting

### Common Issues

1. **"GitHub account not connected" error**
   - Ensure user has signed in with GitHub OAuth
   - Check that GitHub OAuth app is properly configured
   - Verify environment variables are set correctly

2. **"Failed to fetch repositories" error**
   - Check GitHub OAuth scopes include `repo` or `public_repo`
   - Verify GitHub access token is valid and not expired
   - Check network connectivity to GitHub API

3. **Rate limiting errors**
   - GitHub API has rate limits (5000 requests/hour for authenticated users)
   - The implementation includes proper caching to minimize API calls
   - Consider implementing webhook integration for real-time updates

4. **Repository connection fails**
   - Ensure repository exists and user has access
   - Check repository URL format (supports various formats)
   - Verify user has appropriate permissions on the repository

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed GitHub API operation logs in the browser console.

## Security Considerations

1. **Token Storage**: GitHub access tokens are securely stored in the database
2. **Permissions**: Users can only access repositories they have permissions for
3. **Rate Limiting**: Proper rate limiting and caching implemented
4. **Data Validation**: All GitHub API responses are validated before storage
5. **Error Handling**: Comprehensive error handling for API failures

## Production Deployment

When deploying to production:

1. Update GitHub OAuth app settings with production URLs
2. Set production environment variables
3. Ensure database is properly configured
4. Consider implementing webhook integration for real-time updates
5. Monitor GitHub API usage and rate limits

## Next Steps

1. **Webhook Integration**: Implement GitHub webhooks for real-time updates
2. **Advanced Filtering**: Add filtering and sorting options for PRs and issues
3. **Bulk Operations**: Support for bulk issue creation and updates
4. **Team Management**: Support for team-based repository access
5. **Analytics**: Add analytics for PR and issue metrics
