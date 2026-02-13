'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMicrosoftAuth } from './useMicrosoftAuth';
import { useMspOptional } from './useMspOptional';

interface DeployedPackagesResponse {
  deployedWingetIds: string[];
  count: number;
}

export function useDeployedPackages() {
  const { getAccessToken, isAuthenticated } = useMicrosoftAuth();
  const { isMspUser, selectedTenantId } = useMspOptional();
  const tenantKey = isMspUser ? selectedTenantId || 'primary' : 'self';

  const query = useQuery<DeployedPackagesResponse>({
    queryKey: ['catalog', 'deployed', tenantKey],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/intune/apps/deployed', {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isMspUser && selectedTenantId ? { 'X-MSP-Tenant-Id': selectedTenantId } : {}),
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to fetch deployed packages');
      }

      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  const deployedWingetIds = query.data?.deployedWingetIds || [];
  const deployedSet = useMemo(() => new Set(deployedWingetIds), [deployedWingetIds]);

  return {
    deployedWingetIds,
    deployedSet,
    isLoading: query.isLoading,
    error: query.error,
  };
}
