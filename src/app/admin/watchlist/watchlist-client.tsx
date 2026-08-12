"use client";

import { FormEvent, useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { useWatchlistStore } from "@/stores/watchlist-store";
import type { TrackedStock } from "@/features/watchlist/watchlist.schemas";
import { StatusPill } from "@/components/status-pill";

export function WatchlistClient({ initialStocks }: { initialStocks: TrackedStock[] }) {
  const [stocks, setStocks] = useState(initialStocks);
  const [error, setError] = useState("");
  const {
    exchangeFilter,
    searchQuery,
    saving,
    setExchangeFilter,
    setSearchQuery,
    setSaving,
  } = useWatchlistStore();

  const filteredStocks = useMemo(() => {
    return stocks.filter((stock) => {
      const search = searchQuery.trim().toUpperCase();
      const matchesSearch =
        !search ||
        stock.symbol.includes(search) ||
        stock.companyName.toUpperCase().includes(search);
      const matchesExchange =
        exchangeFilter === "ALL" || stock.exchanges.includes(exchangeFilter);

      return matchesSearch && matchesExchange;
    });
  }, [exchangeFilter, searchQuery, stocks]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const exchanges = ["NSE", "BSE"].filter((exchange) =>
      form.getAll("exchanges").includes(exchange),
    );
    const aliases = String(form.get("aliases") ?? "")
      .split(",")
      .flatMap((alias) => {
        const trimmed = alias.trim();
        return trimmed ? [trimmed] : [];
      });

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: form.get("symbol"),
          companyName: form.get("companyName"),
          bseCode: form.get("bseCode"),
          exchanges,
          aliases,
          isActive: true,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? "Could not add stock");
      }

      setStocks((current) => [body.stock, ...current]);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add stock");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(stock: TrackedStock) {
    setError("");
    const previous = stocks;
    setStocks((current) => current.filter((item) => item.$id !== stock.$id));

    try {
      const response = await fetch(`/api/watchlist/${stock.$id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error ?? "Could not deactivate stock");
      }
    } catch (err) {
      setStocks(previous);
      setError(err instanceof Error ? err.message : "Could not deactivate stock");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={submit} className="rounded-md border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Add tracked stock</h2>
        <div className="mt-4 space-y-3">
          <label className="block text-sm font-medium">
            Symbol
            <input
              name="symbol"
              aria-label="Stock symbol"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="INFY"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Company name
            <input
              name="companyName"
              aria-label="Company name"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Infosys Limited"
              required
            />
          </label>
          <div>
            <p className="text-sm font-medium">Exchanges</p>
            <div className="mt-2 flex gap-2">
              {["NSE", "BSE"].map((exchange) => (
                <label
                  key={exchange}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
                >
                  <input
                    name="exchanges"
                    type="checkbox"
                    value={exchange}
                    aria-label={`${exchange} exchange`}
                    defaultChecked={exchange === "NSE"}
                  />
                  {exchange}
                </label>
              ))}
            </div>
          </div>
          <label className="block text-sm font-medium">
            BSE code
            <input
              name="bseCode"
              aria-label="BSE code"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="500209"
            />
          </label>
          <label className="block text-sm font-medium">
            Aliases
            <input
              name="aliases"
              aria-label="Aliases"
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              placeholder="Infosys, Infosys Ltd"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving" : "Add stock"}
          </button>
        </div>
      </form>

      <section className="rounded-md border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search watchlist"
              className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm md:w-80"
              placeholder="Search symbol or company"
            />
          </div>
          <div className="flex gap-1">
            {["ALL", "NSE", "BSE"].map((exchange) => (
              <button
                key={exchange}
                type="button"
                onClick={() => setExchangeFilter(exchange as "ALL" | "NSE" | "BSE")}
                className={`h-9 rounded-md px-3 text-sm font-medium ${
                  exchangeFilter === exchange
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {exchange}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-border">
          {filteredStocks.map((stock) => (
            <div key={stock.$id} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
              <div>
                <h3 className="text-sm font-semibold">{stock.symbol}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{stock.companyName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {stock.exchanges.map((exchange) => (
                    <StatusPill key={exchange}>{exchange}</StatusPill>
                  ))}
                  {stock.bseCode ? <StatusPill>BSE {stock.bseCode}</StatusPill> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deactivate(stock)}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive px-3 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Deactivate
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
