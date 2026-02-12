'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FolderTree,
  Loader2,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMicrosoftAuth } from '@/hooks/useMicrosoftAuth';
import { useMspOptional } from '@/hooks/useMspOptional';
import type { IntuneAppCategorySelection } from '@/types/upload';

interface CategoryConfigProps {
  categories: IntuneAppCategorySelection[];
  onChange: (categories: IntuneAppCategorySelection[]) => void;
}

interface IntuneCategoriesResponse {
  categories?: IntuneAppCategorySelection[];
}

export function CategoryConfig({ categories, onChange }: CategoryConfigProps) {
  const [enabled, setEnabled] = useState(() => categories.length > 0);
  const [query, setQuery] = useState('');
  const [availableCategories, setAvailableCategories] = useState<IntuneAppCategorySelection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getAccessToken } = useMicrosoftAuth();
  const { isMspUser, selectedTenantId } = useMspOptional();

  const loadCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/intune/categories', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(isMspUser && selectedTenantId ? { 'X-MSP-Tenant-Id': selectedTenantId } : {}),
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load Intune categories');
      }

      const data: IntuneCategoriesResponse = await response.json();
      const normalized = (data.categories || [])
        .filter((category) => category?.id && category?.displayName)
        .sort((a, b) => a.displayName.localeCompare(b.displayName));
      setAvailableCategories(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Intune categories');
      setAvailableCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken, isMspUser, selectedTenantId]);

  useEffect(() => {
    if (!enabled || availableCategories.length > 0 || isLoading) {
      return;
    }
    void loadCategories();
  }, [enabled, availableCategories.length, isLoading, loadCategories]);

  const selectedIds = useMemo(() => new Set(categories.map((category) => category.id)), [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return availableCategories;
    }

    return availableCategories.filter((category) =>
      category.displayName.toLowerCase().includes(normalizedQuery)
    );
  }, [availableCategories, query]);

  const handleToggleEnabled = () => {
    const next = !enabled;
    setEnabled(next);
    if (!next) {
      onChange([]);
    } else if (availableCategories.length === 0) {
      void loadCategories();
    }
  };

  const toggleCategory = (category: IntuneAppCategorySelection) => {
    if (selectedIds.has(category.id)) {
      onChange(categories.filter((item) => item.id !== category.id));
      return;
    }

    onChange([...categories, category]);
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={handleToggleEnabled}
        className="flex items-center gap-3 w-full p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        {enabled ? (
          <ToggleRight className="w-6 h-6 text-blue-400 flex-shrink-0" />
        ) : (
          <ToggleLeft className="w-6 h-6 text-slate-500 flex-shrink-0" />
        )}
        <div className="flex-1 text-left">
          <p className={cn('text-sm font-medium', enabled ? 'text-white' : 'text-slate-400')}>
            Configure Categories
          </p>
          <p className="text-xs text-slate-500">
            {enabled
              ? 'Selected categories will be applied in Intune on deployment'
              : 'Deploy without categories'}
          </p>
        </div>
      </button>

      {enabled && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Intune categories..."
                className="w-full pl-10 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => void loadCategories()}
              disabled={isLoading}
              className="px-3 py-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Refresh categories"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          {isLoading && availableCategories.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading categories...
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
              {filteredCategories.length === 0 ? (
                <p className="text-slate-500 text-sm py-2">
                  {availableCategories.length === 0 ? 'No categories found in Intune' : 'No categories match your search'}
                </p>
              ) : (
                filteredCategories.map((category) => {
                  const selected = selectedIds.has(category.id);
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg border transition-colors flex items-center gap-2',
                        selected
                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-200'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                      )}
                    >
                      <FolderTree className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm truncate">{category.displayName}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Selected: {categories.length}
          </p>
        </div>
      )}
    </div>
  );
}
