// Location: src/app/dashboard/project/[id]/page.tsx
// Description: Individual project page for RepoDock.dev - displays project details with tabs for tasks, PR, issues, and environment variables in a dedicated page layout

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '@/features/projects/useProjects';
import { ProjectNav } from '@/components/ProjectNav';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Edit } from 'lucide-react';

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { projects, currentProject, setCurrentProjectById } = useProjects();
  
  const projectId = params.id as string;

  useEffect(() => {
    if (projectId && projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        setCurrentProjectById(projectId);
      } else {
        // Project not found, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [projectId, projects, setCurrentProjectById, router]);

  if (!currentProject) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
        
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Edit Project
        </Button>
      </div>

      {/* Project Navigation */}
      <ProjectNav />
    </div>
  );
}
