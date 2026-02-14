'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  Package,
  Rocket,
  Radar,
  Server,
  ArrowUpCircle,
  BarChart3,
  Settings,
  FolderSync,
  Lightbulb,
  Search,
  Keyboard,
} from 'lucide-react';
import { SHORTCUT_HINTS } from '@/hooks/useKeyboardShortcuts';

const NAVIGATION_ITEMS = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, keywords: 'home dashboard overview' },
  { name: 'App Catalog', href: '/dashboard/apps', icon: Package, keywords: 'apps packages browse search winget' },
  { name: 'Deployments', href: '/dashboard/uploads', icon: Rocket, keywords: 'uploads deploy jobs status' },
  { name: 'Discovered Apps', href: '/dashboard/unmanaged', icon: Radar, keywords: 'unmanaged discovered scan' },
  { name: 'Inventory', href: '/dashboard/inventory', icon: Server, keywords: 'deployed inventory intune' },
  { name: 'App Updates', href: '/dashboard/updates', icon: ArrowUpCircle, keywords: 'updates upgrade versions' },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, keywords: 'analytics reports charts' },
  { name: 'SCCM Migration', href: '/dashboard/sccm', icon: FolderSync, keywords: 'sccm migration configmgr' },
  { name: 'App Requests', href: '/dashboard/app-requests', icon: Lightbulb, keywords: 'suggestions requests vote' },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, keywords: 'settings preferences permissions' },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Command dialog */}
      <div className="absolute inset-0 flex items-start justify-center pt-[20vh] px-4">
        <Command
          className="w-full max-w-lg rounded-xl border border-overlay/10 bg-bg-surface shadow-2xl overflow-hidden"
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-overlay/5">
            <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 py-3 text-sm bg-transparent text-text-primary placeholder:text-text-muted outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-text-muted bg-overlay/10 rounded border border-overlay/5">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-text-muted">
              No results found
            </Command.Empty>

            {/* Navigation group */}
            <Command.Group
              heading="Navigation"
              className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {NAVIGATION_ITEMS.map((item) => (
                <Command.Item
                  key={item.href}
                  value={`${item.name} ${item.keywords}`}
                  onSelect={() => handleSelect(item.href)}
                  className="flex items-center gap-3 px-2 py-2 text-sm text-text-secondary rounded-lg cursor-pointer data-[selected=true]:bg-overlay/5 data-[selected=true]:text-text-primary transition-colors"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Keyboard shortcuts group */}
            {!search && (
              <Command.Group
                heading="Keyboard Shortcuts"
                className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mt-2"
              >
                {SHORTCUT_HINTS.map((hint) => (
                  <Command.Item
                    key={hint.description}
                    value={hint.description}
                    className="flex items-center justify-between px-2 py-2 text-sm text-text-muted rounded-lg cursor-default data-[selected=true]:bg-overlay/5"
                    disabled
                  >
                    <div className="flex items-center gap-3">
                      <Keyboard className="w-4 h-4 flex-shrink-0" />
                      <span>{hint.description}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {hint.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-overlay/10 rounded border border-overlay/5"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
