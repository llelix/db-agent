'use client';

import { useAppStore } from '../store';
import { executeQueryAction } from '../actions/query-action';
import { useCallback, useTransition } from 'react';

export function useQuery() {
  const {
    queryState,
    setQuery,
    setResult,
    setError,
    setIsPending,
    setActiveTab,
    reset,
  } = useAppStore();

  const [isTransition, startTransition] = useTransition();

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryState.query || !queryState.query.trim() || queryState.isPending) return;

    setError(null);
    setResult(null);
    setIsPending(true);

    const formData = new FormData();
    formData.append('query', queryState.query);

    startTransition(async () => {
      try {
        const response = await executeQueryAction(formData);

        if (response.error) {
          setError(response.error);
          setResult(null);
        } else if (response.data) {
          setResult(response.data);
          setQuery(''); // 清空输入框
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '查询执行失败');
        setResult(null);
      } finally {
        setIsPending(false);
      }
    });
  }, [queryState.query, queryState.isPending, setError, setResult, setIsPending, setQuery]);

  const handleQuerySelect = useCallback((selectedQuery: string) => {
    setQuery(selectedQuery);
    setActiveTab('query');
  }, [setQuery, setActiveTab]);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, [setQuery]);

  return {
    // State
    query: queryState.query,
    result: queryState.result,
    error: queryState.error,
    isPending: queryState.isPending || isTransition,
    activeTab: queryState.activeTab,

    // Actions
    setQuery,
    handleSubmit,
    handleQuerySelect,
    clearQuery,
    setActiveTab,
    reset,
  };
}
