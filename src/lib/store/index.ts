'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueryState {
  query: string;
  result: any;
  error: string | null;
  isPending: boolean;
  activeTab: 'query' | 'history';
}

export interface AppState {
  queryState: QueryState;
  setQuery: (query: string) => void;
  setResult: (result: any) => void;
  setError: (error: string | null) => void;
  setIsPending: (isPending: boolean) => void;
  setActiveTab: (tab: 'query' | 'history') => void;
  reset: () => void;
}

const initialState: QueryState = {
  query: '',
  result: null,
  error: null,
  isPending: false,
  activeTab: 'query',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      queryState: initialState,
      setQuery: (query: string) =>
        set((state: AppState) => ({ queryState: { ...state.queryState, query } })),
      setResult: (result: any) =>
        set((state: AppState) => ({ queryState: { ...state.queryState, result, error: null } })),
      setError: (error: string | null) =>
        set((state: AppState) => ({ queryState: { ...state.queryState, error, result: null } })),
      setIsPending: (isPending: boolean) =>
        set((state: AppState) => ({ queryState: { ...state.queryState, isPending } })),
      setActiveTab: (tab: 'query' | 'history') =>
        set((state: AppState) => ({ queryState: { ...state.queryState, activeTab: tab } })),
      reset: () =>
        set(() => ({ queryState: initialState })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        queryState: {
          ...state.queryState,
          result: null,
          error: null,
          isPending: false,
        },
      }),
    }
  )
);
