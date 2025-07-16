# OAuth Setup Guide for RepoDock

This guide will help you set up Google and GitHub OAuth applications for social login in RepoDock.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure the OAuth consent screen if prompted:
   - Choose **External** for user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add your domain to authorized domains (for production)
4. For Application type, select **Web application**
5. Add Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**

### 3. Update Environment Variables

Add to your `.env` file:
```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## GitHub OAuth Setup

### 1. Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** > **New OAuth App**
3. Fill in the application details:
   - **Application name**: RepoDock (or your preferred name)
   - **Homepage URL**: 
     - Development: `http://localhost:3000`
     - Production: `https://yourdomain.com`
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://yourdomain.com/api/auth/callback/github`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy the **Client Secret**

### 2. Update Environment Variables

Add to your `.env` file:
```env
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

## Testing the Setup

1. Make sure all environment variables are set in your `.env` file
2. Restart your development server: `pnpm dev`
3. Go to the login page: `http://localhost:3000/login`
4. You should see Google and GitHub login buttons
5. Click on either button to test the OAuth flow

## Production Deployment

When deploying to production:

1. Update the redirect URIs in both Google Cloud Console and GitHub OAuth App settings
2. Update your environment variables in your production environment
3. Make sure your production domain is added to Google's authorized domains

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**: Make sure the redirect URI in your OAuth app matches exactly with the callback URL
2. **"invalid_client" error**: Check that your client ID and secret are correct
3. **CORS errors**: Make sure your domain is properly configured in the OAuth app settings

### Debug Mode

You can enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed auth operation logs in the browser console.

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth apps for development and production
- Regularly rotate your client secrets
- Monitor your OAuth app usage in the respective consoles
