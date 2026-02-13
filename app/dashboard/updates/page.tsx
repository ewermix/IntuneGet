'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Package,
  History,
  Search,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, AnimatedStatCard, StatCardGrid, AnimatedEmptyState } from '@/components/dashboard';
import { UpdateCard, UpdateCardSkeleton, AutoUpdateHistory } from '@/components/updates';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAvailableUpdates,
  useAutoUpdateHistory,
  useRefreshAvailableUpdates,
  useTriggerUpdate,
  useUpdatePolicy,
} from '@/hooks/use-updates';
import { useMspOptional } from '@/hooks/useMspOptional';
import { fadeIn } from '@/lib/animations/variants';
import { cn } from '@/lib/utils';
import type { AvailableUpdate, UpdatePolicyType } from '@/types/update-policies';

export default function UpdatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const shouldReduceMotion = useReducedMotion();
  const { isMspUser, selectedTenantId, managedTenants } = useMspOptional();
  const tenantId = isMspUser ? selectedTenantId || undefined : undefined;
  const hasGrantedManagedTenants = managedTenants.some(
    (tenant) => tenant.is_active && tenant.consent_status === 'granted' && Boolean(tenant.tenant_id)
  );
  const mspTenantSelectionRequired = isMspUser && hasGrantedManagedTenants && !selectedTenantId;

  // Data hooks
  const {
    data: updatesData,
    isLoading: isLoadingUpdates,
    error: updatesError,
    refetch: refetchUpdates,
    isFetching: isFetchingUpdates,
  } = useAvailableUpdates({
    tenantId,
    criticalOnly: showCriticalOnly,
  });

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    fetchMore: fetchMoreHistory,
    hasMore: hasMoreHistory,
  } = useAutoUpdateHistory({ tenantId });

  const { refreshUpdates, isRefreshing } = useRefreshAvailableUpdates({ tenantId });
  const { triggerUpdate } = useTriggerUpdate();
  const { updatePolicy } = useUpdatePolicy();

  const updates = updatesData?.updates || [];
  const history = historyData?.history || [];

  // Filter updates by search
  const filteredUpdates = updates.filter((update) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      update.display_name.toLowerCase().includes(searchLower) ||
      update.winget_id.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const availableCount = updates.length;
  const criticalCount = updates.filter((u) => u.is_critical).length;
  const autoUpdateCount = updates.filter(
    (u) => u.policy?.policy_type === 'auto_update' && u.policy?.is_enabled
  ).length;
  const recentAutoUpdates = history.filter(
    (h) => h.status === 'completed' && isWithinDays(h.completed_at, 7)
  ).length;
  const failedUpdates = history.filter(
    (h) => h.status === 'failed' && isWithinDays(h.triggered_at, 7)
  ).length;

  // Oldest critical update age
  const oldestCriticalAge = (() => {
    const criticals = updates.filter((u) => u.is_critical);
    if (criticals.length === 0) return null;
    const oldest = criticals.reduce((prev, curr) =>
      new Date(prev.detected_at) < new Date(curr.detected_at) ? prev : curr
    );
    const days = Math.floor(
      (Date.now() - new Date(oldest.detected_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days === 0) return 'detected today';
    if (days === 1) return 'oldest: 1 day ago';
    return `oldest: ${days} days ago`;
  })();

  // Handlers
  const handleTriggerUpdate = useCallback(async (update: AvailableUpdate) => {
    setUpdatingIds((prev) => new Set(prev).add(update.id));
    try {
      await triggerUpdate({
        winget_id: update.winget_id,
        tenant_id: update.tenant_id,
      });
      router.push('/dashboard/uploads');
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(update.id);
        return next;
      });
    }
  }, [triggerUpdate, router]);

  const handlePolicyChange = useCallback(async (
    update: AvailableUpdate,
    policyType: UpdatePolicyType
  ) => {
    await updatePolicy({
      winget_id: update.winget_id,
      tenant_id: update.tenant_id,
      policy_type: policyType,
    });
    refetchUpdates();
  }, [updatePolicy, refetchUpdates]);

  const handleBulkUpdate = useCallback(async () => {
    const eligibleUpdates = filteredUpdates.filter(
      (u) => u.policy?.policy_type !== 'ignore' && u.policy?.policy_type !== 'pin_version'
    );

    for (const update of eligibleUpdates) {
      setUpdatingIds((prev) => new Set(prev).add(update.id));
      try {
        await triggerUpdate({
          winget_id: update.winget_id,
          tenant_id: update.tenant_id,
        });
      } finally {
        setUpdatingIds((prev) => {
          const next = new Set(prev);
          next.delete(update.id);
          return next;
        });
      }
    }

    router.push('/dashboard/uploads');
  }, [filteredUpdates, triggerUpdate, router]);

  const handleRefresh = useCallback(async () => {
    await refreshUpdates();
    await refetchUpdates();
  }, [refreshUpdates, refetchUpdates]);

  // Auto-refresh when initial load returns empty results
  const hasTriggeredAutoRefresh = useRef(false);
  useEffect(() => {
    if (
      !isLoadingUpdates &&
      !isRefreshing &&
      !hasTriggeredAutoRefresh.current &&
      !mspTenantSelectionRequired &&
      updates.length === 0
    ) {
      hasTriggeredAutoRefresh.current = true;
      void handleRefresh();
    }
  }, [isLoadingUpdates, isRefreshing, mspTenantSelectionRequired, updates.length, handleRefresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Updates"
        description="Manage app updates and auto-update policies"
        gradient
        gradientColors="cyan"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                void handleRefresh();
              }}
              disabled={isFetchingUpdates || isRefreshing}
              className="text-text-secondary hover:text-text-primary"
            >
              <RefreshCw
                className={cn(
                  'w-4 h-4 mr-2',
                  (isFetchingUpdates || isRefreshing) && 'animate-spin'
                )}
              />
              Refresh
            </Button>
            {filteredUpdates.length > 0 && (
              <Button
                onClick={handleBulkUpdate}
                className="bg-accent-cyan hover:bg-accent-cyan-bright text-bg-deepest font-medium"
              >
                Update All ({filteredUpdates.length})
              </Button>
            )}
          </div>
        }
      />

      {/* Critical Updates Banner */}
      {criticalCount > 0 && (
        <motion.div
          variants={shouldReduceMotion ? undefined : fadeIn}
          initial={shouldReduceMotion ? { opacity: 1 } : 'hidden'}
          animate={shouldReduceMotion ? { opacity: 1 } : 'visible'}
          className="glass-light rounded-xl p-4 border-l-4 border-l-status-warning border-t border-r border-b border-black/[0.08] bg-gradient-to-r from-status-warning/5 to-transparent"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0" />
            <p className="text-sm font-medium text-text-primary">
              {criticalCount} critical update{criticalCount !== 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} attention
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <StatCardGrid columns={4}>
        <AnimatedStatCard
          title="Available Updates"
          value={availableCount}
          icon={Package}
          color="cyan"
          delay={0}
          loading={isLoadingUpdates}
        />
        <AnimatedStatCard
          title="Critical Updates"
          value={criticalCount}
          icon={AlertTriangle}
          color={criticalCount > 0 ? 'warning' : 'neutral'}
          delay={0.1}
          loading={isLoadingUpdates}
          description={oldestCriticalAge || undefined}
        />
        <AnimatedStatCard
          title="Auto-Update Enabled"
          value={autoUpdateCount}
          icon={RefreshCw}
          color="success"
          delay={0.2}
          loading={isLoadingUpdates}
          description={availableCount > 0 ? `${autoUpdateCount} of ${availableCount}` : undefined}
        />
        <AnimatedStatCard
          title="Updated (7 days)"
          value={recentAutoUpdates}
          icon={CheckCircle2}
          color="violet"
          delay={0.3}
          loading={isLoadingHistory}
          description={failedUpdates > 0 ? `${failedUpdates} failed` : undefined}
        />
      </StatCardGrid>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v: string) => setActiveTab(v as 'available' | 'history')}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <TabsList className="glass-light border border-overlay/5">
            <TabsTrigger value="available" className="data-[state=active]:bg-overlay/10">
              <Package className="w-4 h-4 mr-2" />
              Available Updates
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-overlay/10">
              <History className="w-4 h-4 mr-2" />
              Update History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Available Updates Tab */}
        <TabsContent value="available" className="mt-0">
          {/* Search & Filter Bar */}
          {activeTab === 'available' && !mspTenantSelectionRequired && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <Input
                  placeholder="Search updates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-bg-elevated border-overlay/10 text-text-primary placeholder:text-text-muted"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant={showCriticalOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowCriticalOnly(!showCriticalOnly)}
                  className={cn(
                    showCriticalOnly
                      ? 'bg-status-warning/20 text-status-warning hover:bg-status-warning/30'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  <AlertTriangle className="w-4 h-4 mr-1.5" />
                  Critical
                </Button>

                {!isLoadingUpdates && updates.length > 0 && (
                  <span className="text-xs text-text-muted whitespace-nowrap">
                    Showing {filteredUpdates.length} of {updates.length}
                  </span>
                )}
              </div>
            </div>
          )}

          {mspTenantSelectionRequired ? (
            <AnimatedEmptyState
              icon={Package}
              title="Select a tenant to view updates"
              description="Use the tenant switcher in the header to pick which managed tenant you want to update."
              color="neutral"
              showOrbs={false}
            />
          ) : isLoadingUpdates ? (
            <UpdateCardSkeleton count={6} />
          ) : updatesError ? (
            <AnimatedEmptyState
              icon={XCircle}
              title="Failed to load updates"
              description={updatesError.message}
              color="neutral"
              action={{
                label: 'Try Again',
                onClick: () => refetchUpdates(),
                variant: 'secondary',
              }}
            />
          ) : filteredUpdates.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredUpdates.map((update, index) => (
                <UpdateCard
                  key={update.id}
                  update={update}
                  onTriggerUpdate={handleTriggerUpdate}
                  onPolicyChange={handlePolicyChange}
                  isUpdating={updatingIds.has(update.id)}
                  index={index}
                />
              ))}
            </motion.div>
          ) : updates.length > 0 ? (
            <AnimatedEmptyState
              icon={Search}
              title="No updates match your search"
              description="Try adjusting your search criteria"
              color="neutral"
              showOrbs={false}
              action={{
                label: 'Clear Search',
                onClick: () => setSearch(''),
                variant: 'secondary',
              }}
            />
          ) : (
            <AnimatedEmptyState
              icon={CheckCircle2}
              title="All apps are up to date"
              description="No updates are currently available for your deployed apps"
              color="cyan"
            />
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0">
          {mspTenantSelectionRequired ? (
            <AnimatedEmptyState
              icon={History}
              title="Select a tenant to view update history"
              description="Auto-update history is shown per tenant to avoid mixing deployment timelines."
              color="neutral"
              showOrbs={false}
            />
          ) : (
            <AutoUpdateHistory
              history={history}
              isLoading={isLoadingHistory}
              onLoadMore={fetchMoreHistory}
              hasMore={hasMoreHistory}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function isWithinDays(dateString: string | null, days: number): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= days;
}
