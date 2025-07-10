// Location: src/app/layout.tsx
// Description: Root layout for RepoDock.dev - provides global HTML structure, metadata, font loading, and theme provider setup for the entire application

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoDock - AI Powered Workspace for Developers",
  description: "Modern developer workspace that manages your projects, tasks, and environment variables with 256-bit encryption. Built to save you time.",
  keywords: ["developer tools", "project management", "workspace", "environment variables", "encryption", "productivity"],
  authors: [{ name: "RepoDock Team" }],
  creator: "RepoDock",
  publisher: "RepoDock",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://repodock.dev'),
  openGraph: {
    title: "RepoDock - AI Powered Workspace for Developers",
    description: "Modern developer workspace that manages your projects, tasks, and environment variables with 256-bit encryption.",
    url: 'https://repodock.dev',
    siteName: 'RepoDock',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "RepoDock - AI Powered Workspace for Developers",
    description: "Modern developer workspace that manages your projects, tasks, and environment variables with 256-bit encryption.",
    creator: '@repodock',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
