'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  X,
  Plug,
  Package,
  Bell,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSettings } from '@/components/providers/UserSettingsProvider';
import { useDashboardStats } from '@/hooks/useAnalytics';
import { cn } from '@/lib/utils';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  isComplete: boolean;
}

export function OnboardingChecklist() {
  const { settings, setOnboardingCompleted } = useUserSettings();
  const { data: stats } = useDashboardStats();
  const [dismissed, setDismissed] = useState(false);

  // If onboarding is already completed or dismissed, don't show
  if (settings.onboardingCompleted || dismissed) return null;

  const steps: ChecklistStep[] = [
    {
      id: 'connect',
      title: 'Connect to Intune',
      description: 'Sign in and grant admin consent',
      icon: Plug,
      href: '/dashboard/settings?tab=permissions',
      isComplete: true, // If they're seeing this, they're already connected
    },
    {
      id: 'deploy',
      title: 'Deploy your first app',
      description: 'Browse the catalog and deploy a package',
      icon: Package,
      href: '/dashboard/apps',
      isComplete: (stats?.totalDeployed ?? 0) > 0,
    },
    {
      id: 'notifications',
      title: 'Set up notifications',
      description: 'Get alerts for deployment status changes',
      icon: Bell,
      href: '/dashboard/settings?tab=notifications',
      isComplete: false, // Would need notification settings check
    },
    {
      id: 'explore',
      title: 'Explore your inventory',
      description: 'View apps currently in your Intune tenant',
      icon: Users,
      href: '/dashboard/inventory',
      isComplete: false,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const allComplete = completedCount === steps.length;

  const handleDismiss = async () => {
    setDismissed(true);
    await setOnboardingCompleted(true);
  };

  return (
    <div className="glass-light rounded-xl p-5 border border-overlay/5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Getting Started</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {completedCount} of {steps.length} complete
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-overlay/5"
          aria-label="Dismiss onboarding"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-overlay/10 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.href}
            className={cn(
              'flex items-center gap-3 p-2.5 rounded-lg transition-colors group',
              step.isComplete
                ? 'opacity-60'
                : 'hover:bg-overlay/5'
            )}
          >
            {step.isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-status-success flex-shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-text-muted flex-shrink-0 group-hover:text-accent-cyan transition-colors" />
            )}
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-medium',
                step.isComplete ? 'text-text-muted line-through' : 'text-text-primary group-hover:text-accent-cyan-bright'
              )}>
                {step.title}
              </p>
              <p className="text-xs text-text-muted">{step.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {allComplete && (
        <Button
          onClick={handleDismiss}
          className="w-full mt-4 bg-gradient-to-r from-accent-cyan to-accent-violet hover:opacity-90 text-bg-elevated border-0"
          size="sm"
        >
          All done - dismiss
        </Button>
      )}
    </div>
  );
}
