"use client";

import { create } from "zustand";
import type { Exchange } from "@/features/watchlist/watchlist.schemas";

type ExchangeFilter = "ALL" | Exchange;

type WatchlistState = {
  exchangeFilter: ExchangeFilter;
  searchQuery: string;
  selectedStockSymbol?: string;
  saving: boolean;
  setExchangeFilter: (exchangeFilter: ExchangeFilter) => void;
  setSearchQuery: (searchQuery: string) => void;
  setSelectedStockSymbol: (selectedStockSymbol?: string) => void;
  setSaving: (saving: boolean) => void;
};

export const useWatchlistStore = create<WatchlistState>((set) => ({
  exchangeFilter: "ALL",
  searchQuery: "",
  saving: false,
  setExchangeFilter: (exchangeFilter) => set({ exchangeFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedStockSymbol: (selectedStockSymbol) => set({ selectedStockSymbol }),
  setSaving: (saving) => set({ saving }),
}));
