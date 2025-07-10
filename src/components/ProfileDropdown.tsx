// Location: src/components/ProfileDropdown.tsx
// Description: Profile dropdown component for RepoDock.dev - provides user profile menu with settings, encryption password management, and logout functionality

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';

interface ProfileDropdownProps {
  onLogout: () => void;
}

export function ProfileDropdown({ onLogout }: ProfileDropdownProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
        >
          <User className="w-4 h-4" />
          <span>{user.username}</span>
          <ChevronDown className={cn(
            "w-3 h-3 transition-transform",
            isOpen && "rotate-180"
          )} />
        </Button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-md shadow-lg z-20">
              <div className="p-2">
                {/* User Info */}
                <div className="px-2 py-1.5 border-b border-border mb-2">
                  <p className="text-sm font-medium">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>

                {/* Menu Items */}
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/dashboard/settings');
                      setIsOpen(false);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>

                  <div className="border-t border-border my-1" />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      onLogout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

    </>
  );
}
