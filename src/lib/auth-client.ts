import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  fetchOptions: {
    onError(context) {
      console.error("Auth client error:", {
        error: context.error,
        url: context.response?.url,
        status: context.response?.status,
        statusText: context.response?.statusText
      });
    },
    onSuccess(context) {
      // Log successful auth operations for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log("Auth operation successful:", {
          url: context.response.url,
          status: context.response.status
        });
      }
    },
    // Add timeout to prevent hanging requests
    timeout: 10000, // 10 seconds
  },
  // Disable cache for critical auth operations to ensure fresh data
  disableCache: false, // Keep cache enabled for better performance
});
