// Location: src/app/page.tsx
// Description: Landing page for RepoDock.dev - showcases all features, provides authentication, and serves as the entry point for users with modern design and feature highlights

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  FolderOpen,
  Shield,
  Palette,
  GitBranch,
  CheckSquare,
  Bug,
  Settings,
  Zap,
  Users,
  Lock,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { AuthForm } from '@/features/auth/AuthForm';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const features = [
    {
      icon: Briefcase,
      title: 'Multiple Workspaces',
      description: 'Organize your projects across different workspaces for better separation and management.',
    },
    {
      icon: FolderOpen,
      title: 'Project Management',
      description: 'Create and manage multiple projects within each workspace with detailed tracking.',
    },
    {
      icon: Shield,
      title: '256-bit Encryption',
      description: 'Your environment variables are secured with military-grade 256-bit encryption.',
    },
    {
      icon: Palette,
      title: 'Modern UI/UX',
      description: 'Beautiful, minimal interface with dark and light themes for optimal productivity.',
    },
    {
      icon: GitBranch,
      title: 'Pull Requests',
      description: 'Track and manage pull requests across all your projects in one unified interface.',
    },
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Built-in task management with priorities, assignments, and due dates.',
    },
    {
      icon: Bug,
      title: 'Issue Tracking',
      description: 'Comprehensive issue tracking with categories, priorities, and status management.',
    },
    {
      icon: Settings,
      title: 'Environment Variables',
      description: 'Secure global and per-project environment variable management with encryption.',
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern technologies for optimal performance and speed.',
    },
    {
      icon: Users,
      title: 'Developer Focused',
      description: 'Designed by developers, for developers, with productivity in mind.',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'All data stored locally with advanced encryption for maximum security.',
    },
    {
      icon: Smartphone,
      title: 'Responsive Design',
      description: 'Works perfectly on desktop, tablet, and mobile devices.',
    },
  ];

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">RepoDock</span>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => openAuthModal('login')}>
              Sign In
            </Button>
            <Button onClick={() => openAuthModal('signup')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            AI Powered Workspace,{' '}
            <span className="text-primary">Built to Save You Time</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            RepoDock is a modern developer workspace that manages your projects, tasks, and environment variables,
            so you don't have to. Focus on what matters most - building great software.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => openAuthModal('signup')}>
              Start Building Today
            </Button>
            <Button size="lg" variant="outline" onClick={() => openAuthModal('login')}>
              Sign In to Continue
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required. Get started in seconds.
          </p>
        </div>
      </section>
      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage your projects
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              RepoDock provides all the tools you need to organize, track, and secure your development workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-card p-6 rounded-lg border border-border/50 hover:border-border transition-colors">
                <feature.icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why developers choose RepoDock
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with modern technologies and developer experience in mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to supercharge your workflow?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of developers who trust RepoDock to manage their projects and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => openAuthModal('signup')}>
              Get Started for Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => openAuthModal('login')}>
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">RepoDock</span>
          </div>
          <p className="text-muted-foreground text-sm">
            © 2024 RepoDock. Built with ❤️ for developers.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        size="md"
      >
        <AuthForm
          mode={authMode}
          onModeChange={setAuthMode}
        />
      </Modal>
    </div>
  );
}
