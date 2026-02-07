'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Clock,
  Bell,
  BellOff,
  Pin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/AppIcon';
import { UpdatePolicySelector } from './UpdatePolicySelector';
import { cn } from '@/lib/utils';
import { classifyUpdateType } from '@/types/update-policies';
import { fadeUp, springPresets } from '@/lib/animations/variants';
import type { AvailableUpdate, UpdatePolicyType } from '@/types/update-policies';

interface UpdateCardProps {
  update: AvailableUpdate;
  onTriggerUpdate: (update: AvailableUpdate) => Promise<void>;
  onPolicyChange: (update: AvailableUpdate, policyType: UpdatePolicyType) => Promise<void>;
  onDismiss?: (update: AvailableUpdate) => void;
  isUpdating?: boolean;
  index?: number;
}

const policyIcons: Record<string, typeof RefreshCw> = {
  auto_update: RefreshCw,
  notify: Bell,
  ignore: BellOff,
  pin_version: Pin,
};

const policyLabels: Record<string, string> = {
  auto_update: 'Auto',
  notify: 'Notify',
  ignore: 'Ignore',
  pin_version: 'Pinned',
};

const policyColors: Record<string, string> = {
  auto_update: 'text-status-success bg-status-success/10 border-status-success/20',
  notify: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/20',
  ignore: 'text-text-muted bg-black/5 border-black/10',
  pin_version: 'text-status-warning bg-status-warning/10 border-status-warning/20',
};

const updateTypeLabels: Record<string, string> = {
  patch: 'Patch',
  minor: 'Minor',
  major: 'Major',
};

const updateTypeColors: Record<string, string> = {
  patch: 'bg-status-success/10 text-status-success border-status-success/20',
  minor: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20',
  major: 'bg-status-warning/10 text-status-warning border-status-warning/20',
};

export function UpdateCard({
  update,
  onTriggerUpdate,
  onPolicyChange,
  onDismiss,
  isUpdating = false,
  index = 0,
}: UpdateCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const handlePolicyChange = async (policyType: UpdatePolicyType) => {
    await onPolicyChange(update, policyType);
  };

  const policyStatus = update.policy;
  const isAutoUpdateEnabled =
    policyStatus?.policy_type === 'auto_update' && policyStatus?.is_enabled;
  const hasFailures = (policyStatus?.consecutive_failures || 0) > 0;
  const updateType = classifyUpdateType(update.current_version, update.latest_version);
  const PolicyIcon = policyStatus?.policy_type ? policyIcons[policyStatus.policy_type] : null;

  return (
    <motion.div
      variants={shouldReduceMotion ? undefined : fadeUp}
      initial={shouldReduceMotion ? { opacity: 1 } : 'hidden'}
      animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
      transition={shouldReduceMotion ? undefined : { delay: index * 0.05 }}
      whileHover={shouldReduceMotion ? undefined : { y: -2, transition: springPresets.snappy }}
      className={cn(
        'glass-light rounded-xl p-5 border transition-colors duration-200 relative group',
        update.is_critical
          ? 'border-l-4 border-l-status-warning border-t-status-warning/15 border-r-status-warning/15 border-b-status-warning/15 bg-gradient-to-r from-status-warning/[0.04] to-transparent'
          : 'border-black/[0.08] hover:border-accent-cyan/20 hover:shadow-soft-md'
      )}
    >
      {/* Failure indicator dot */}
      {hasFailures && (
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-status-error shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
      )}

      {/* Top row: Icon, name, badges */}
      <div className="flex items-start gap-3.5 mb-4">
        {/* App Icon */}
        <AppIcon
          packageId={update.winget_id}
          packageName={update.display_name}
          size="lg"
        />

        {/* Name and ID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {update.display_name}
            </h3>
            {update.is_critical && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-status-warning bg-status-warning/10 border border-status-warning/20 rounded-full flex-shrink-0">
                <AlertTriangle className="w-3 h-3" />
                Critical
              </span>
            )}
          </div>
          <span className="text-xs font-mono text-text-muted">{update.winget_id}</span>
        </div>

        {/* Policy badge */}
        {policyStatus?.policy_type && PolicyIcon && (
          <span
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border flex-shrink-0',
              policyColors[policyStatus.policy_type] || 'text-text-muted bg-black/5 border-black/10'
            )}
          >
            <PolicyIcon className="w-3 h-3" />
            {policyLabels[policyStatus.policy_type]}
          </span>
        )}
      </div>

      {/* Version comparison */}
      <div className="flex items-center gap-3 mb-4">
        <span className="px-3 py-1.5 text-sm font-mono bg-black/[0.04] text-text-secondary border border-black/[0.08] rounded-lg">
          {update.current_version}
        </span>

        <div className="flex flex-col items-center gap-0.5">
          <ArrowRight className="w-4 h-4 text-text-muted" />
          <span className={cn(
            'text-[10px] font-medium uppercase tracking-wider',
            updateType === 'major' ? 'text-status-warning' : updateType === 'minor' ? 'text-accent-cyan' : 'text-status-success'
          )}>
            {updateTypeLabels[updateType]}
          </span>
        </div>

        <span className={cn(
          'px-3 py-1.5 text-sm font-mono rounded-lg border',
          updateTypeColors[updateType]
        )}>
          {update.latest_version}
        </span>
      </div>

      {/* Bottom row: status info + actions */}
      <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {isAutoUpdateEnabled && (
            <span className="flex items-center gap-1 text-status-success">
              <RefreshCw className="w-3 h-3" />
              Auto-update ON
            </span>
          )}
          {hasFailures && (
            <span className="flex items-center gap-1 text-status-error">
              <XCircle className="w-3 h-3" />
              {policyStatus?.consecutive_failures} failed
            </span>
          )}
          {policyStatus?.last_auto_update_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last: {new Date(policyStatus.last_auto_update_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <UpdatePolicySelector
            currentPolicy={policyStatus?.policy_type || null}
            onPolicyChange={handlePolicyChange}
            size="sm"
            showLabel={false}
          />

          <Button
            size="sm"
            onClick={() => onTriggerUpdate(update)}
            disabled={isUpdating}
            className="bg-accent-cyan hover:bg-accent-cyan-bright text-bg-deepest font-medium"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Update
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

interface UpdateCardSkeletonProps {
  count?: number;
}

export function UpdateCardSkeleton({ count = 3 }: UpdateCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="glass-light rounded-xl p-5 border border-black/[0.08]"
        >
          {/* Top row */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-12 h-12 bg-black/[0.06] rounded-xl animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <div className="h-4 w-36 bg-black/[0.08] rounded animate-pulse mb-2" />
              <div className="h-3 w-24 bg-black/[0.05] rounded animate-pulse" />
            </div>
            <div className="h-6 w-16 bg-black/[0.06] rounded-lg animate-pulse" />
          </div>

          {/* Version row */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-20 bg-black/[0.05] rounded-lg animate-pulse" />
            <div className="h-4 w-4 bg-black/[0.05] rounded animate-pulse" />
            <div className="h-8 w-20 bg-black/[0.05] rounded-lg animate-pulse" />
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06]">
            <div className="flex items-center gap-3">
              <div className="h-3 w-24 bg-black/[0.05] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-black/[0.06] rounded animate-pulse" />
              <div className="h-8 w-20 bg-black/[0.06] rounded animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
