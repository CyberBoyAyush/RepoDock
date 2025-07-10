// Location: src/components/SearchModal.tsx
// Description: Global search modal for RepoDock.dev - provides unified search across workspaces, projects, tasks, and environment variables with keyboard navigation

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Folder, Briefcase, CheckSquare, Settings, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useWorkspaces } from '@/features/workspaces/useWorkspaces';
import { useProjects } from '@/features/projects/useProjects';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'workspace' | 'project' | 'task' | 'env';
  title: string;
  subtitle?: string;
  description?: string;
  action: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  
  const { workspaces } = useWorkspaces();
  const { projects } = useProjects();
  const router = useRouter();

  // Generate search results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const searchResults: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search workspaces
    workspaces.forEach(workspace => {
      if (workspace.name.toLowerCase().includes(lowerQuery) || 
          workspace.description?.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: workspace.id,
          type: 'workspace',
          title: workspace.name,
          subtitle: 'Workspace',
          description: workspace.description,
          action: () => {
            // Switch to workspace logic would go here
            onClose();
          }
        });
      }
    });

    // Search projects
    projects.forEach(project => {
      if (project.name.toLowerCase().includes(lowerQuery) || 
          project.description?.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: 'Project',
          description: project.description,
          action: () => {
            router.push(`/dashboard/project/${project.id}`);
            onClose();
          }
        });
      }
    });

    // Add quick actions
    if ('tasks'.includes(lowerQuery)) {
      searchResults.push({
        id: 'tasks',
        type: 'task',
        title: 'Tasks',
        subtitle: 'Quick Action',
        description: 'View all tasks across projects',
        action: () => {
          // Navigate to tasks view
          onClose();
        }
      });
    }

    if ('environment'.includes(lowerQuery) || 'env'.includes(lowerQuery)) {
      searchResults.push({
        id: 'env',
        type: 'env',
        title: 'Environment Variables',
        subtitle: 'Quick Action',
        description: 'Manage global environment variables',
        action: () => {
          // Navigate to env view
          onClose();
        }
      });
    }

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, workspaces, projects, router, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            results[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'workspace':
        return Briefcase;
      case 'project':
        return Folder;
      case 'task':
        return CheckSquare;
      case 'env':
        return Settings;
      default:
        return Search;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className="p-0"
    >
      <div className="flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="p-4 border-b border-border/40">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search workspaces, projects, tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm bg-transparent border-0 focus:outline-none focus:ring-0"
              autoFocus
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-[400px]">
          {results.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {query.trim() ? (
                <>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No results found for "{query}"</p>
                </>
              ) : (
                <>
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start typing to search...</p>
                  <p className="text-xs mt-1">Search across workspaces, projects, and more</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {results.map((result, index) => {
                const Icon = getIcon(result.type);
                return (
                  <button
                    key={result.id}
                    onClick={result.action}
                    className={cn(
                      'w-full flex items-center space-x-3 p-3 rounded-md text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium truncate">{result.title}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {result.subtitle}
                        </span>
                      </div>
                      {result.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {result.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/40 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">Esc</kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="text-xs">
              {results.length} result{results.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
