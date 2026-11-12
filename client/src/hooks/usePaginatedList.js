import { useState, useMemo } from 'react';

/**
 * Long list guard hook: ensures large datasets (> 50 items) do not freeze
 * DOM rendering on phones or low-powered laptops, providing clean "Load more"
 * pagination.
 */
export function usePaginatedList(items = [], pageSize = 50) {
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const visibleItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = (items?.length || 0) > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + pageSize);
  };

  const reset = () => {
    setVisibleCount(pageSize);
  };

  return {
    visibleItems,
    hasMore,
    loadMore,
    reset,
    totalCount: items?.length || 0,
    remainingCount: Math.max(0, (items?.length || 0) - visibleCount),
  };
}

