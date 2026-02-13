'use client';

import { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/animations/variants';
import type { AutoUpdateHistoryWithPolicy } from '@/types/update-policies';

interface AutoUpdateHistoryProps {
  history: AutoUpdateHistoryWithPolicy[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const statusConfig: Record<
  string,
  {
    icon: typeof Clock;
    color: string;
    borderColor: string;
    label: string;
    animate?: boolean;
  }
> = {
  pending: {
    icon: Clock,
    color: 'text-text-muted',
    borderColor: 'border-l-black/20',
    label: 'Pending',
  },
  packaging: {
    icon: Loader2,
    color: 'text-accent-cyan',
    borderColor: 'border-l-accent-cyan',
    label: 'Packaging',
    animate: true,
  },
  deploying: {
    icon: Loader2,
    color: 'text-accent-violet',
    borderColor: 'border-l-accent-violet',
    label: 'Deploying',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-status-success',
    borderColor: 'border-l-status-success',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-status-error',
    borderColor: 'border-l-status-error',
    label: 'Failed',
  },
  cancelled: {
    icon: XCircle,
    color: 'text-text-muted',
    borderColor: 'border-l-black/20',
    label: 'Cancelled',
  },
};

const updateTypeLabels = {
  patch: 'Patch',
  minor: 'Minor',
  major: 'Major',
};

type DateGroup = 'Today' | 'Yesterday' | 'This Week' | 'Older';

function getDateGroup(dateString: string): DateGroup {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  return 'Older';
}

function groupByDate(
  items: AutoUpdateHistoryWithPolicy[]
): { group: DateGroup; items: AutoUpdateHistoryWithPolicy[] }[] {
  const groups: Map<DateGroup, AutoUpdateHistoryWithPolicy[]> = new Map();
  const order: DateGroup[] = ['Today', 'Yesterday', 'This Week', 'Older'];

  for (const item of items) {
    const group = getDateGroup(item.triggered_at);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(item);
  }

  return order
    .filter((g) => groups.has(g))
    .map((group) => ({ group, items: groups.get(group)! }));
}

export function AutoUpdateHistory({
  history,
  isLoading,
  onLoadMore,
  hasMore,
}: AutoUpdateHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const grouped = useMemo(() => groupByDate(history), [history]);

  if (isLoading && history.length === 0) {
    return <AutoUpdateHistorySkeleton />;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-text-muted">No auto-update history yet</p>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {grouped.map(({ group, items }) => (
        <div key={group}>
          {/* Date group heading */}
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 pl-1">
            {group}
          </h3>

          {/* Timeline items with connecting line */}
          <div className="relative">
            {/* Vertical connecting line */}
            <div className="absolute left-[1.5px] top-0 bottom-0 w-px bg-black/[0.08]" />

            <div className="space-y-2">
              {items.map((item) => {
                const status = statusConfig[item.status];
                const isExpanded = expandedId === item.id;
                const StatusIcon = status.icon;
                const currentIndex = globalIndex++;

                return (
                  <motion.div
                    key={item.id}
                    variants={shouldReduceMotion ? undefined : fadeUp}
                    initial={shouldReduceMotion ? { opacity: 1 } : 'hidden'}
                    animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
                    transition={shouldReduceMotion ? undefined : { delay: currentIndex * 0.03 }}
                    className={cn(
                      'glass-light rounded-lg border-l-[3px] border border-black/[0.08] overflow-hidden ml-3',
                      status.borderColor,
                      isExpanded && 'border-black/[0.12]'
                    )}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-overlay/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        <StatusIcon
                          className={cn(
                            'w-4 h-4 flex-shrink-0',
                            status.color,
                            status.animate && 'animate-spin'
                          )}
                        />

                        {/* App Info */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {item.display_name || item.policy.winget_id}
                            </span>
                            <span
                              className={cn(
                                'px-1.5 py-0.5 text-xs font-medium rounded border',
                                item.update_type === 'major'
                                  ? 'text-status-warning bg-status-warning/10 border-status-warning/20'
                                  : item.update_type === 'minor'
                                  ? 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20'
                                  : 'text-text-muted bg-overlay/[0.04] border-black/[0.08]'
                              )}
                            >
                              {updateTypeLabels[item.update_type]}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                            <span className="font-mono">{item.from_version}</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-mono">{item.to_version}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Status label + Timestamp */}
                        <div className="text-right">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                              status.color,
                              item.status === 'completed' && 'bg-status-success/10',
                              item.status === 'failed' && 'bg-status-error/10',
                              item.status === 'packaging' && 'bg-accent-cyan/10',
                              item.status === 'deploying' && 'bg-accent-violet/10',
                              (item.status === 'pending' || item.status === 'cancelled') && 'bg-overlay/[0.04]'
                            )}
                          >
                            {status.label}
                          </span>
                          <p className="text-xs text-text-muted mt-1">
                            {formatTime(item.triggered_at)}
                          </p>
                        </div>

                        {/* Expand Arrow */}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-text-muted" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-text-muted" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-black/[0.06]">
                        <div className="mt-4 bg-overlay/[0.02] rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-text-muted text-xs">Winget ID</span>
                            <p className="text-text-primary font-mono text-xs mt-1">
                              {item.policy.winget_id}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted text-xs">Tenant</span>
                            <p className="text-text-primary font-mono text-xs mt-1 truncate">
                              {item.policy.tenant_id}
                            </p>
                          </div>
                          <div>
                            <span className="text-text-muted text-xs">Triggered</span>
                            <p className="text-text-primary text-xs mt-1">
                              {new Date(item.triggered_at).toLocaleString()}
                            </p>
                          </div>
                          {item.completed_at && (
                            <div>
                              <span className="text-text-muted text-xs">Completed</span>
                              <p className="text-text-primary text-xs mt-1">
                                {new Date(item.completed_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>

                        {item.error_message && (
                          <div className="mt-3 p-3 bg-status-error/[0.06] border border-status-error/20 rounded-lg">
                            <p className="text-xs text-status-error">
                              {item.error_message}
                            </p>
                          </div>
                        )}

                        {item.packaging_job_id && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-text-muted hover:text-text-primary"
                              asChild
                            >
                              <a
                                href={`/dashboard/uploads?job=${item.packaging_job_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Job Details
                                <ExternalLink className="w-3 h-3 ml-2" />
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      {/* Load More */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-text-muted hover:text-text-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function AutoUpdateHistorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Group heading skeleton */}
      <div>
        <div className="h-3 w-16 bg-black/[0.06] rounded animate-pulse mb-3 ml-1" />
        <div className="relative">
          <div className="absolute left-[1.5px] top-0 bottom-0 w-px bg-black/[0.08]" />
          <div className="space-y-2 ml-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`today-${i}`}
                className="glass-light rounded-lg border-l-[3px] border-l-black/[0.12] border border-black/[0.08] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-black/[0.06] rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-black/[0.08] rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-black/[0.05] rounded animate-pulse" />
                  </div>
                  <div className="text-right">
                    <div className="h-5 w-16 bg-black/[0.06] rounded-full animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-black/[0.05] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second group */}
      <div>
        <div className="h-3 w-20 bg-black/[0.06] rounded animate-pulse mb-3 ml-1" />
        <div className="relative">
          <div className="absolute left-[1.5px] top-0 bottom-0 w-px bg-black/[0.08]" />
          <div className="space-y-2 ml-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={`older-${i}`}
                className="glass-light rounded-lg border-l-[3px] border-l-black/[0.12] border border-black/[0.08] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-black/[0.06] rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-black/[0.08] rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-black/[0.05] rounded animate-pulse" />
                  </div>
                  <div className="text-right">
                    <div className="h-5 w-16 bg-black/[0.06] rounded-full animate-pulse mb-1" />
                    <div className="h-3 w-20 bg-black/[0.05] rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
