"use client";

import { create } from "zustand";

type JobMonitorState = {
  selectedJobName: string;
  autoRefresh: boolean;
  lastRefresh?: string;
  setSelectedJobName: (selectedJobName: string) => void;
  setAutoRefresh: (autoRefresh: boolean) => void;
  markRefreshed: () => void;
};

export const useJobMonitorStore = create<JobMonitorState>((set) => ({
  selectedJobName: "all",
  autoRefresh: false,
  setSelectedJobName: (selectedJobName) => set({ selectedJobName }),
  setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
  markRefreshed: () => set({ lastRefresh: new Date().toISOString() }),
}));
