import { useEffect, useMemo, useState } from 'react';

export function usePaginatedItems(items = [], { pageSize = 20, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, resetDeps);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  return {
    page: safePage,
    setPage,
    totalPages,
    totalItems,
    startItem,
    endItem,
    paginatedItems,
  };
}
