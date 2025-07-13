// Location: src/app/page.tsx
// Description: Enhanced landing page for RepoDock.dev - modern, visually appealing design with animations, gradients, and improved user experience

'use client';

import Link from 'next/link';
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
  Smartphone,
  ArrowRight,
  Star,
  Code,
  Database,
  Globe,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';


export default function LandingPage() {

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

  // Remove modal logic since we're using dedicated pages

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />

      {/* Floating Header */}
      <header className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-6xl px-4">
        <div className="bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/20">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg shadow-primary/20">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                RepoDock
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-1 bg-muted/50 rounded-xl p-1">
                <ThemeToggle />
              </div>

              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" className="hover:bg-primary/10 rounded-xl transition-all duration-200">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/30 transition-all duration-300 rounded-xl transform hover:scale-105">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Mobile theme toggle */}
              <div className="md:hidden">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mt-10 relative z-10 py-16 md:py-24 px-4 md:px-6">
        <div className="container mx-auto text-center max-w-5xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in shadow-lg backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>New: Enhanced encryption & performance</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up leading-tight">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/80 bg-clip-text text-transparent block mb-2">
              AI Powered Workspace,
            </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent block">
              Built to Save You Time
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            RepoDock is a modern developer workspace that manages your projects, tasks, and environment variables,
            so you don't have to. Focus on what matters most - <span className="text-primary font-semibold">building great software</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up delay-300">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105 text-base px-8 py-6 rounded-xl">
                <Zap className="w-5 h-5 mr-2" />
                Start Building Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 text-base px-8 py-6 rounded-xl backdrop-blur-sm">
                Sign In to Continue
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground animate-fade-in-up delay-400">
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <Star className="w-4 h-4 text-yellow-500 fill-current" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span>Enterprise security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-12 md:py-16 px-4 md:px-6 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-border/20">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            <div className="text-center group">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  10K+
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  Active Developers
                </div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  50K+
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  Projects Managed
                </div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  99.9%
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  Uptime Guarantee
                </div>
              </div>
            </div>
            <div className="text-center group">
              <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                  24/7
                </div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  Support Available
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-muted/20 to-muted/40">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary text-sm font-medium mb-6 shadow-lg backdrop-blur-sm">
              <Code className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
              Everything you need to manage your projects
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              RepoDock provides all the tools you need to organize, track, and secure your development workflow with enterprise-grade features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-card/80 backdrop-blur-sm p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium mb-6 shadow-lg backdrop-blur-sm">
              <Star className="w-4 h-4" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">
              Why developers choose RepoDock
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Built with modern technologies and developer experience in mind. Join thousands of developers who trust RepoDock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-2xl hover:bg-card/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-transparent hover:border-border/30"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                  {/* Floating particles effect */}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/30 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 px-4 md:px-6 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto text-center max-w-5xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary text-sm font-medium mb-6 shadow-lg backdrop-blur-sm">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Ready to get started?</span>
          </div>

          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent leading-tight">
            Ready to supercharge your workflow?
          </h2>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers who trust RepoDock to manage their projects and boost productivity.
            <span className="text-primary font-semibold"> Start building today.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-2xl hover:shadow-primary/30 transition-all duration-300 transform hover:scale-105 text-base px-8 py-6 rounded-xl">
                <Zap className="w-5 h-5 mr-2" />
                Get Started for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 text-base px-8 py-6 rounded-xl backdrop-blur-sm">
                <Users className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-primary" />
              <span>Enterprise security</span>
            </div>
            <div className="flex items-center gap-2 bg-card/50 px-3 py-2 rounded-full border border-border/50 backdrop-blur-sm">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>Global availability</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/40 bg-gradient-to-b from-background to-muted/20 py-10 md:py-12 px-4 md:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center space-x-3 mb-4 group">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                RepoDock
              </span>
            </div>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm leading-relaxed">
              The modern developer workspace that saves you time and keeps your projects organized with enterprise-grade security.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-1.5 rounded-full border border-border/30 backdrop-blur-sm">
                <Database className="w-3 h-3 text-primary" />
                <span className="font-medium">Local-first</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-1.5 rounded-full border border-border/30 backdrop-blur-sm">
                <Lock className="w-3 h-3 text-green-500" />
                <span className="font-medium">256-bit encryption</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/50 px-3 py-1.5 rounded-full border border-border/30 backdrop-blur-sm">
                <Code className="w-3 h-3 text-blue-500" />
                <span className="font-medium">Open source</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/40 pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 RepoDock. Built with <span className="text-red-500">❤️</span> for developers worldwide.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Empowering developers to build better software, faster.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
