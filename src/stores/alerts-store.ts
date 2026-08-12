"use client";

import { create } from "zustand";

type AlertsState = {
  priorityFilter: "all" | "high" | "medium" | "low";
  eventTypeFilter: string;
  symbolFilter: string;
  compact: boolean;
  setPriorityFilter: (priorityFilter: AlertsState["priorityFilter"]) => void;
  setEventTypeFilter: (eventTypeFilter: string) => void;
  setSymbolFilter: (symbolFilter: string) => void;
  setCompact: (compact: boolean) => void;
};

export const useAlertsStore = create<AlertsState>((set) => ({
  priorityFilter: "all",
  eventTypeFilter: "all",
  symbolFilter: "",
  compact: false,
  setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
  setEventTypeFilter: (eventTypeFilter) => set({ eventTypeFilter }),
  setSymbolFilter: (symbolFilter) => set({ symbolFilter }),
  setCompact: (compact) => set({ compact }),
}));
